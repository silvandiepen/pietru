import { decrypt } from '@pietru/auth';
import {
  ENVIRONMENTS,
  MESSAGE_EVENT_TYPES,
  MESSAGE_STATUSES,
  SENDING_MODES,
  generateId,
  type MessageStatus,
  parseEmail,
  renderTemplate,
  safeJsonParse,
} from '@pietru/core';
import { ResendProvider } from '@pietru/providers';
import { sendMessageSchema } from '@pietru/validation';
import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { AppVariables, Env } from '../env';
import { authenticateProjectApiKey, authenticateUserSession, requireProjectApiKey } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

type ProviderConfigRecord = {
  id: string;
  project_id: string;
  provider_type: string;
  config_encrypted: string;
  mode: 'send' | 'capture' | 'send_and_capture';
  environment: 'development' | 'preview' | 'production';
  default_from: string | null;
  allowed_domains_json: string | null;
};

function getDefaultMode(environment: string) {
  return environment === ENVIRONMENTS.production ? SENDING_MODES.send : SENDING_MODES.capture;
}

function encodeCursor(createdAt: string, id: string): string {
  return btoa(JSON.stringify({ createdAt, id }));
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(atob(cursor)) as { createdAt: string; id: string };
  } catch {
    return null;
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function putIfPresent(bucket: R2Bucket, key: string, value: string | undefined) {
  if (typeof value === 'string') {
    await bucket.put(key, value);
    return key;
  }
  return null;
}

async function resolveProviderConfig(c: { env: Env }, projectId: string, environment: string) {
  return c.env.DB.prepare(
    'SELECT * FROM provider_configs WHERE project_id = ? AND environment = ? ORDER BY created_at DESC LIMIT 1',
  )
    .bind(projectId, environment)
    .first<ProviderConfigRecord>();
}

async function verifyProjectOwnership(db: D1Database, projectId: string, userId: string) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first<{ id: string }>();
}

async function authenticateAccess(c: {
  req: { header(name: string): string | undefined };
  env: Env;
  set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]) => void;
}) {
  const authorization = c.req.header('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authenticateProjectApiKey(c, authorization.slice('Bearer '.length).trim());
  }

  const token = getCookie(c as never, 'session');
  if (!token) {
    return new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'Missing credentials' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return authenticateUserSession(c, token);
}

const messageRoutes = new Hono<App>();

messageRoutes.post('/messages', requireProjectApiKey, async (c) => {
  const body = sendMessageSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const projectId = c.get('projectId');
  const environment = c.get('environment');
  if (!projectId || !environment) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing project scope' } }, 401);
  }

  // Resolve template if templateId is provided
  let resolvedSubject = body.data.subject ?? '';
  let resolvedHtml = body.data.html ?? null;
  let resolvedText = body.data.text ?? null;

  if (body.data.templateId) {
    const template = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ? AND project_id = ?')
      .bind(body.data.templateId, projectId)
      .first<{
        id: string;
        subject: string;
        html: string | null;
        text: string | null;
      }>();

    if (!template) {
      return c.json({ error: { code: 'not_found', message: 'Template not found' } }, 404);
    }

    const templateData = body.data.data ?? {};
    resolvedSubject = renderTemplate(template.subject, templateData);
    resolvedHtml = template.html ? renderTemplate(template.html, templateData) : null;
    resolvedText = template.text ? renderTemplate(template.text, templateData) : null;
  }

  if (!resolvedHtml && !resolvedText) {
    return c.json({ error: { code: 'validation_error', message: 'Template must have html or text' } }, 400);
  }

  const idempotencyKey = c.req.header('Idempotency-Key');
  let idempotencyHash: string | null = null;
  if (idempotencyKey) {
    idempotencyHash = await sha256Hex(idempotencyKey);
    const kvKey = `idem:${projectId}:${environment}:${idempotencyHash}`;
    const existingId = await c.env.KV.get(kvKey);
    if (existingId) {
      const existing = await c.env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(existingId).first();
      if (existing) {
        return c.json({ data: existing });
      }
    }
  }

  const providerConfig = await resolveProviderConfig(c, projectId, environment);
  const mode = providerConfig?.mode ?? getDefaultMode(environment);
  const now = new Date().toISOString();
  const messageId = generateId('msg');
  const provider = providerConfig?.provider_type ?? null;
  const fromAddress = body.data.from || providerConfig?.default_from || '';
  const parsedFrom = parseEmail(fromAddress);
  const allowedDomains = safeJsonParse<string[]>(providerConfig?.allowed_domains_json, []);
  const fromDomain = parsedFrom.email?.split('@')[1] ?? null;

  if (allowedDomains.length > 0 && fromDomain && !allowedDomains.includes(fromDomain)) {
    return c.json({ error: { code: 'invalid_from_domain', message: 'From domain is not allowed' } }, 400);
  }

  if (!fromAddress) {
    return c.json({ error: { code: 'missing_from', message: 'From address is required' } }, 400);
  }

  const htmlStorageKey = mode !== SENDING_MODES.send ? await putIfPresent(c.env.STORAGE, `${messageId}/html`, resolvedHtml ?? undefined) : null;
  const textStorageKey = mode !== SENDING_MODES.send ? await putIfPresent(c.env.STORAGE, `${messageId}/text`, resolvedText ?? undefined) : null;
  const rawStorageKey =
    mode === SENDING_MODES.sendAndCapture
      ? await putIfPresent(c.env.STORAGE, `${messageId}/raw`, JSON.stringify(body.data))
      : null;

  let status: MessageStatus = mode === SENDING_MODES.capture ? MESSAGE_STATUSES.captured : MESSAGE_STATUSES.queued;
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;
  let sentAt: string | null = null;
  let failedAt: string | null = null;

  if (mode !== SENDING_MODES.capture) {
    if (!providerConfig) {
      return c.json({ error: { code: 'provider_not_configured', message: 'Provider config is required for sending' } }, 400);
    }

    try {
      const providerSecrets = JSON.parse(await decrypt(providerConfig.config_encrypted, c.env.ENCRYPTION_KEY)) as {
        apiKey: string;
        webhookSecret?: string;
      };
      const resend = new ResendProvider();
      const sendResult = await resend.sendEmail(
        {
          id: messageId,
          to: body.data.to,
          from: fromAddress,
          subject: resolvedSubject,
          html: resolvedHtml,
          text: resolvedText,
          cc: body.data.cc,
          bcc: body.data.bcc,
          replyTo: body.data.replyTo,
          tags: body.data.tags,
        },
        {
          providerType: providerConfig.provider_type,
          apiKey: providerSecrets.apiKey,
          webhookSecret: providerSecrets.webhookSecret,
          mode: providerConfig.mode,
          environment: providerConfig.environment,
          defaultFrom: providerConfig.default_from,
          allowedDomains,
        },
      );

      providerMessageId = sendResult.id;
      status = MESSAGE_STATUSES.sent;
      sentAt = new Date().toISOString();
    } catch (error) {
      status = MESSAGE_STATUSES.failed;
      failedAt = new Date().toISOString();
      errorMessage = error instanceof Error ? error.message : 'Unknown provider error';
    }
  }

  await c.env.DB.prepare(
    'INSERT INTO messages (id, project_id, provider_config_id, environment, to_address, from_address, reply_to, cc_json, bcc_json, subject, html, text, status, provider, provider_message_id, error, tags_json, raw_storage_key, html_storage_key, text_storage_key, idempotency_key_hash, created_at, queued_at, sent_at, failed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      messageId,
      projectId,
      providerConfig?.id ?? null,
      environment,
      body.data.to,
      Array.isArray(body.data.to) ? body.data.to.join(', ') : body.data.to,
      fromAddress,
      body.data.replyTo ?? null,
      JSON.stringify(body.data.cc ?? []),
      JSON.stringify(body.data.bcc ?? []),
      resolvedSubject,
      mode === SENDING_MODES.send ? resolvedHtml ?? null : null,
      mode === SENDING_MODES.send ? resolvedText ?? null : null,
      status,
      provider,
      providerMessageId,
      errorMessage,
      JSON.stringify(body.data.tags ?? {}),
      rawStorageKey,
      htmlStorageKey,
      textStorageKey,
      idempotencyHash,
      now,
      status === MESSAGE_STATUSES.queued ? now : null,
      sentAt,
      failedAt,
    )
    .run();

  await c.env.DB.prepare(
    'INSERT INTO message_events (id, message_id, project_id, type, provider, payload_json, payload_storage_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      generateId('mevt'),
      messageId,
      projectId,
      status === MESSAGE_STATUSES.failed
        ? MESSAGE_EVENT_TYPES.failed
        : status === MESSAGE_STATUSES.sent
          ? MESSAGE_EVENT_TYPES.sent
          : MESSAGE_EVENT_TYPES.created,
      provider,
      JSON.stringify(body.data),
      rawStorageKey,
      now,
    )
    .run();

  if (idempotencyHash) {
    await c.env.KV.put(`idem:${projectId}:${environment}:${idempotencyHash}`, messageId, { expirationTtl: 86400 });
  }

  const created = await c.env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(messageId).first();
  return c.json({ data: created }, 201);
});

messageRoutes.get('/messages', async (c) => {
  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  const queryProjectId = c.req.query('project');
  const queryEnvironment = c.req.query('environment');
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const decodedCursor = c.req.query('cursor') ? decodeCursor(c.req.query('cursor') as string) : null;

  if ('userId' in authResult) {
    if (queryProjectId) {
      const owned = await verifyProjectOwnership(c.env.DB, queryProjectId, authResult.userId);
      if (!owned) {
        return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
      }
    }

    const filters: unknown[] = [authResult.userId];
    let where = ' FROM messages m INNER JOIN projects p ON p.id = m.project_id WHERE p.user_id = ?';

    if (queryProjectId) {
      where += ' AND m.project_id = ?';
      filters.push(queryProjectId);
    }

    for (const [queryKey, column] of [
      ['environment', 'm.environment'],
      ['to', 'm.to_address'],
      ['from', 'm.from_address'],
      ['status', 'm.status'],
    ] as const) {
      const value = c.req.query(queryKey);
      if (value) {
        where += ` AND ${column} = ?`;
        filters.push(value);
      }
    }

    const dateFrom = c.req.query('dateFrom');
    if (dateFrom) {
      where += ' AND m.created_at >= ?';
      filters.push(dateFrom);
    }

    const dateTo = c.req.query('dateTo');
    if (dateTo) {
      where += ' AND m.created_at <= ?';
      filters.push(dateTo);
    }

    if (decodedCursor) {
      where += ' AND (m.created_at < ? OR (m.created_at = ? AND m.id < ?))';
      filters.push(decodedCursor.createdAt, decodedCursor.createdAt, decodedCursor.id);
    }

    const result = await c.env.DB.prepare(`SELECT m.* ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`)
      .bind(...filters, limit + 1)
      .all<Record<string, unknown>>();

    const items = result.results.slice(0, limit);
    const nextCursor =
      result.results.length > limit && items.length > 0
        ? encodeCursor(String(items[items.length - 1].created_at), String(items[items.length - 1].id))
        : null;

    return c.json({ data: { items, nextCursor } });
  }

  const filters: unknown[] = [authResult.projectId];
  let where = ' FROM messages WHERE project_id = ?';

  if (queryEnvironment) {
    where += ' AND environment = ?';
    filters.push(queryEnvironment);
  } else if (authResult.environment) {
    where += ' AND environment = ?';
    filters.push(authResult.environment);
  }

  for (const [queryKey, column] of [
    ['to', 'to_address'],
    ['from', 'from_address'],
    ['status', 'status'],
  ] as const) {
    const value = c.req.query(queryKey);
    if (value) {
      where += ` AND ${column} = ?`;
      filters.push(value);
    }
  }

  if (decodedCursor) {
    where += ' AND (created_at < ? OR (created_at = ? AND id < ?))';
    filters.push(decodedCursor.createdAt, decodedCursor.createdAt, decodedCursor.id);
  }

  const result = await c.env.DB.prepare(`SELECT * ${where} ORDER BY created_at DESC, id DESC LIMIT ?`)
    .bind(...filters, limit + 1)
    .all<Record<string, unknown>>();

  const items = result.results.slice(0, limit);
  const nextCursor =
    result.results.length > limit && items.length > 0
      ? encodeCursor(String(items[items.length - 1].created_at), String(items[items.length - 1].id))
      : null;

  return c.json({ data: { items, nextCursor } });
});

messageRoutes.get('/messages/:id', async (c) => {
  const messageId = c.req.param('id');
  if (!messageId) {
    return c.json({ error: { code: 'validation_error', message: 'Message id is required' } }, 400);
  }

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  const message =
    'userId' in authResult
      ? await c.env.DB.prepare(
          'SELECT m.* FROM messages m INNER JOIN projects p ON p.id = m.project_id WHERE m.id = ? AND p.user_id = ?',
        )
          .bind(messageId, authResult.userId)
          .first<Record<string, unknown>>()
      : await c.env.DB.prepare('SELECT * FROM messages WHERE id = ? AND project_id = ? AND environment = ?')
          .bind(messageId, authResult.projectId, authResult.environment)
          .first<Record<string, unknown>>();

  if (!message) {
    return c.json({ error: { code: 'not_found', message: 'Message not found' } }, 404);
  }

  const events = await c.env.DB.prepare('SELECT * FROM message_events WHERE message_id = ? ORDER BY created_at ASC')
    .bind(messageId)
    .all();

  return c.json({ data: { ...message, events: events.results } });
});

// Test inbox: list captured messages for a project+environment combo
// inbox format: {projectSlug}-{environment} (e.g. "my-app-development")
messageRoutes.get('/test-inboxes/:inbox/messages', async (c) => {
  const inbox = c.req.param('inbox');
  if (!inbox) {
    return c.json({ error: { code: 'validation_error', message: 'Inbox is required' } }, 400);
  }

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  // Parse inbox: last dash-separated segment is the environment, rest is the slug
  const lastDash = inbox.lastIndexOf('-');
  if (lastDash < 0) {
    return c.json({ error: { code: 'validation_error', message: 'Invalid inbox format' } }, 400);
  }

  const environment = inbox.slice(lastDash + 1);
  const slug = inbox.slice(0, lastDash);

  // Validate environment
  if (!['development', 'preview'].includes(environment)) {
    return c.json({ error: { code: 'validation_error', message: 'Invalid environment for test inbox' } }, 400);
  }

  const limit = Math.min(Number(c.req.query('limit') ?? 50), 100);

  if ('userId' in authResult) {
    const project = await c.env.DB.prepare('SELECT id FROM projects WHERE slug = ? AND user_id = ?')
      .bind(slug, authResult.userId)
      .first<{ id: string }>();

    if (!project) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }

    const result = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE project_id = ? AND environment = ? ORDER BY created_at DESC LIMIT ?',
    )
      .bind(project.id, environment, limit)
      .all();

    return c.json({ data: result.results });
  }

  // API key auth: verify project slug matches
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND slug = ?')
    .bind(authResult.projectId, slug)
    .first<{ id: string }>();

  if (!project) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const result = await c.env.DB.prepare(
    'SELECT * FROM messages WHERE project_id = ? AND environment = ? ORDER BY created_at DESC LIMIT ?',
  )
    .bind(authResult.projectId, environment, limit)
    .all();

  return c.json({ data: result.results });
});

export { messageRoutes };
