import { generateId } from '@pietru/core';
import { signAwsRequest } from '@pietru/providers';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const createDomainSchema = z.object({
  domain: z.string().min(1).max(253),
});

// ── SES API helper ────────────────────────────────────────────────

async function sesApiCall(
  method: string,
  path: string,
  env: Env,
  body?: Record<string, unknown>,
) {
  const baseUrl = `https://email.${env.PIETRU_SES_REGION}.amazonaws.com`;
  const url = `${baseUrl}${path}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  const { authorization, amzDate } = await signAwsRequest(
    method, url, bodyStr, env.PIETRU_SES_REGION,
    env.PIETRU_SES_ACCESS_KEY_ID, env.PIETRU_SES_SECRET_ACCESS_KEY,
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': authorization,
    'X-Amz-Date': amzDate,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' && method !== 'DELETE' ? bodyStr : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `SES API error: ${response.status}`);
  }

  return response.json();
}

// ── Helpers ───────────────────────────────────────────────────────

async function ensureOwnedProject(db: D1Database, projectId: string, userId: string) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first<{ id: string }>();
}

interface SesIdentityResponse {
  DkimAttributes?: {
    Tokens?: string[];
    DkimStatus?: string;
  };
  VerificationStatus?: string;
}

// ── Routes ────────────────────────────────────────────────────────

const domainVerificationRoutes = new Hono<App>();

// List all domain verifications for a project
domainVerificationRoutes.get('/projects/:id/domain-verifications', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const result = await c.env.DB.prepare(
    'SELECT id, project_id, domain, verification_status, dkim_status, dkim_tokens_json, error_message, verified_at, created_at, updated_at FROM domain_verifications WHERE project_id = ? AND verification_status != ? ORDER BY created_at DESC',
  )
    .bind(projectId, 'deleted')
    .all();

  return c.json({ data: result.results });
});

// Start domain verification
domainVerificationRoutes.post('/projects/:id/domain-verifications', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const body = createDomainSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  // Normalize domain: strip trailing dots, lowercase
  const domain = body.data.domain.replace(/\.$/, '').toLowerCase();

  // Check if domain is already being verified (ignore deleted)
  const existing = await c.env.DB.prepare(
    'SELECT id FROM domain_verifications WHERE domain = ? AND project_id = ? AND verification_status != ?',
  )
    .bind(domain, projectId, 'deleted')
    .first<{ id: string }>();
  if (existing) {
    return c.json({ error: { code: 'conflict', message: `Domain "${domain}" is already being verified` } }, 409);
  }

  // Call SES to create the email identity
  await sesApiCall('POST', '/v2/email/identities', c.env, { EmailIdentity: domain });

  const now = new Date().toISOString();
  const id = generateId('dv');

  // Insert initial record
  await c.env.DB.prepare(
    'INSERT INTO domain_verifications (id, project_id, domain, verification_status, dkim_status, dkim_tokens_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, projectId, domain, 'PENDING', 'PENDING', null, now, now)
    .run();

  // Immediately fetch verification tokens from SES
  let dkimTokens: string[] | null = null;
  let verificationStatus: string | null = null;
  let dkimStatus: string | null = null;

  try {
    const identity = await sesApiCall(
      'GET',
      `/v2/email/identities/${encodeURIComponent(domain)}`,
      c.env,
    ) as SesIdentityResponse;

    dkimTokens = identity.DkimAttributes?.Tokens ?? null;
    verificationStatus = identity.VerificationStatus ?? null;
    dkimStatus = identity.DkimAttributes?.DkimStatus ?? null;
  } catch {
    // Non-fatal: tokens can be fetched later via the verify endpoint
  }

  // Update the record with fetched data
  await c.env.DB.prepare(
    'UPDATE domain_verifications SET verification_status = ?, dkim_status = ?, dkim_tokens_json = ?, updated_at = ? WHERE id = ?',
  )
    .bind(
      verificationStatus,
      dkimStatus,
      dkimTokens ? JSON.stringify(dkimTokens) : null,
      now,
      id,
    )
    .run();

  return c.json({
    data: {
      id,
      project_id: projectId,
      domain,
      verification_status: verificationStatus,
      dkim_status: dkimStatus,
      dkim_tokens_json: dkimTokens ? JSON.stringify(dkimTokens) : null,
      dkim_tokens: dkimTokens,
      created_at: now,
      updated_at: now,
    },
  }, 201);
});

// Get a single domain verification (refreshes from SES)
domainVerificationRoutes.get('/projects/:id/domain-verifications/:domainId', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const domainId = c.req.param('domainId');
  const userId = c.get('userId');
  if (!projectId || !domainId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and domain id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const record = await c.env.DB.prepare(
    'SELECT id, project_id, domain, verification_status, dkim_status, dkim_tokens_json, error_message, verified_at, created_at, updated_at FROM domain_verifications WHERE id = ? AND project_id = ? AND verification_status != ?',
  )
    .bind(domainId, projectId, 'deleted')
    .first<{
      id: string;
      project_id: string;
      domain: string;
      verification_status: string | null;
      dkim_status: string | null;
      dkim_tokens_json: string | null;
      error_message: string | null;
      verified_at: string | null;
      created_at: string;
      updated_at: string;
    }>();

  if (!record) {
    return c.json({ error: { code: 'not_found', message: 'Domain verification not found' } }, 404);
  }

  // Refresh from SES
  let verificationStatus = record.verification_status;
  let dkimStatus = record.dkim_status;
  let dkimTokensJson = record.dkim_tokens_json;

  try {
    const identity = await sesApiCall(
      'GET',
      `/v2/email/identities/${encodeURIComponent(record.domain)}`,
      c.env,
    ) as SesIdentityResponse;

    verificationStatus = identity.VerificationStatus ?? record.verification_status;
    dkimStatus = identity.DkimAttributes?.DkimStatus ?? record.dkim_status;
    const tokens = identity.DkimAttributes?.Tokens;
    dkimTokensJson = tokens ? JSON.stringify(tokens) : record.dkim_tokens_json;

    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE domain_verifications SET verification_status = ?, dkim_status = ?, dkim_tokens_json = ?, updated_at = ? WHERE id = ?',
    )
      .bind(verificationStatus, dkimStatus, dkimTokensJson, now, domainId)
      .run();
  } catch {
    // Non-fatal: return stale data
  }

  return c.json({
    data: {
      ...record,
      verification_status: verificationStatus,
      dkim_status: dkimStatus,
      dkim_tokens_json: dkimTokensJson,
      dkim_tokens: dkimTokensJson ? JSON.parse(dkimTokensJson) : null,
    },
  });
});

// Force re-check verification status from SES
domainVerificationRoutes.post('/projects/:id/domain-verifications/:domainId/verify', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const domainId = c.req.param('domainId');
  const userId = c.get('userId');
  if (!projectId || !domainId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and domain id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const record = await c.env.DB.prepare(
    'SELECT id, domain, verification_status, dkim_status FROM domain_verifications WHERE id = ? AND project_id = ? AND verification_status != ?',
  )
    .bind(domainId, projectId, 'deleted')
    .first<{ id: string; domain: string; verification_status: string; dkim_status: string }>();

  if (!record) {
    return c.json({ error: { code: 'not_found', message: 'Domain verification not found' } }, 404);
  }

  // Fetch current status from SES
  const identity = await sesApiCall(
    'GET',
    `/v2/email/identities/${encodeURIComponent(record.domain)}`,
    c.env,
  ) as SesIdentityResponse;

  const verificationStatus = identity.VerificationStatus ?? null;
  const dkimStatus = identity.DkimAttributes?.DkimStatus ?? null;
  const tokens = identity.DkimAttributes?.Tokens ?? null;
  const dkimTokensJson = tokens ? JSON.stringify(tokens) : null;

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE domain_verifications SET verification_status = ?, dkim_status = ?, dkim_tokens_json = ?, verified_at = ?, updated_at = ? WHERE id = ?',
  )
    .bind(verificationStatus, dkimStatus, dkimTokensJson, verificationStatus === 'SUCCESS' ? now : null, now, domainId)
    .run();

  return c.json({
    data: {
      id: domainId,
      domain: record.domain,
      verification_status: verificationStatus,
      dkim_status: dkimStatus,
      dkim_tokens: tokens,
      verified_at: verificationStatus === 'SUCCESS' ? now : null,
      updated_at: now,
    },
  });
});

// Delete a domain verification
domainVerificationRoutes.delete('/projects/:id/domain-verifications/:domainId', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const domainId = c.req.param('domainId');
  const userId = c.get('userId');
  if (!projectId || !domainId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and domain id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const record = await c.env.DB.prepare(
    'SELECT id, domain, verification_status FROM domain_verifications WHERE id = ? AND project_id = ? AND verification_status != ?',
  )
    .bind(domainId, projectId, 'deleted')
    .first<{ id: string; domain: string; verification_status: string }>();

  if (!record) {
    return c.json({ error: { code: 'not_found', message: 'Domain verification not found' } }, 404);
  }

  // Delete from SES (best-effort)
  try {
    await sesApiCall(
      'DELETE',
      `/v2/email/identities/${encodeURIComponent(record.domain)}`,
      c.env,
    );
  } catch {
    // Non-fatal: still mark as deleted locally
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE domain_verifications SET verification_status = ?, updated_at = ? WHERE id = ?',
  )
    .bind('deleted', now, domainId)
    .run();

  return c.json({ data: { ok: true } });
});

export { domainVerificationRoutes };
