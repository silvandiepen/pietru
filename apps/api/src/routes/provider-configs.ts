import { decrypt, encrypt } from '@pietru/auth';
import { generateId } from '@pietru/core';
import { ResendProvider } from '@pietru/providers';
import { createProviderConfigSchema } from '@pietru/validation';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const updateProviderConfigSchema = createProviderConfigSchema.partial();

function getProvider(providerType: string) {
  if (providerType === 'resend') {
    return new ResendProvider();
  }
  throw new Error(`Unsupported provider: ${providerType}`);
}

async function ensureOwnedProject(db: D1Database, projectId: string, userId: string) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first<{ id: string }>();
}

const providerConfigRoutes = new Hono<App>();
providerConfigRoutes.use('*', requireUserSession);

providerConfigRoutes.get('/projects/:id/provider-configs', async (c) => {
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
    'SELECT id, project_id, provider_type, mode, environment, default_from, allowed_domains_json, created_at, updated_at FROM provider_configs WHERE project_id = ? ORDER BY created_at DESC',
  )
    .bind(projectId)
    .all();

  return c.json({ data: result.results });
});

providerConfigRoutes.post('/projects/:id/provider-configs', async (c) => {
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

  const body = createProviderConfigSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  await getProvider(body.data.providerType).validateConfig({
    providerType: body.data.providerType,
    ...body.data.config,
  });

  const now = new Date().toISOString();
  const id = generateId('pcfg');
  await c.env.DB.prepare(
    'INSERT INTO provider_configs (id, project_id, provider_type, config_encrypted, mode, environment, default_from, allowed_domains_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      projectId,
      body.data.providerType,
      await encrypt(JSON.stringify(body.data.config), c.env.ENCRYPTION_KEY),
      body.data.mode,
      body.data.environment,
      body.data.defaultFrom ?? null,
      JSON.stringify(body.data.allowedDomains ?? []),
      now,
      now,
    )
    .run();

  return c.json({ data: { id, ...body.data, config: undefined, createdAt: now, updatedAt: now } }, 201);
});

providerConfigRoutes.patch('/projects/:id/provider-configs/:configId', async (c) => {
  const projectId = c.req.param('id');
  const configId = c.req.param('configId');
  const userId = c.get('userId');
  if (!projectId || !configId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and config id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const existing = await c.env.DB.prepare('SELECT * FROM provider_configs WHERE id = ? AND project_id = ?')
    .bind(configId, projectId)
    .first<{
      id: string;
      provider_type: string;
      config_encrypted: string;
      mode: string;
      environment: string;
      default_from: string | null;
      allowed_domains_json: string | null;
    }>();
  if (!existing) {
    return c.json({ error: { code: 'not_found', message: 'Provider config not found' } }, 404);
  }

  const body = updateProviderConfigSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const merged = {
    providerType: body.data.providerType ?? existing.provider_type,
    config: body.data.config ?? JSON.parse(await decrypt(existing.config_encrypted, c.env.ENCRYPTION_KEY)),
    mode: body.data.mode ?? existing.mode,
    environment: body.data.environment ?? existing.environment,
    defaultFrom: body.data.defaultFrom ?? existing.default_from ?? undefined,
    allowedDomains: body.data.allowedDomains ?? JSON.parse(existing.allowed_domains_json ?? '[]'),
  };

  await getProvider(merged.providerType).validateConfig({
    providerType: merged.providerType,
    ...merged.config,
  });

  const updatedAt = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE provider_configs SET provider_type = ?, config_encrypted = ?, mode = ?, environment = ?, default_from = ?, allowed_domains_json = ?, updated_at = ? WHERE id = ? AND project_id = ?',
  )
    .bind(
      merged.providerType,
      await encrypt(JSON.stringify(merged.config), c.env.ENCRYPTION_KEY),
      merged.mode,
      merged.environment,
      merged.defaultFrom ?? null,
      JSON.stringify(merged.allowedDomains ?? []),
      updatedAt,
      configId,
      projectId,
    )
    .run();

  return c.json({ data: { id: configId, ...merged, config: undefined, updatedAt } });
});

providerConfigRoutes.post('/projects/:id/provider-configs/:configId/validate', async (c) => {
  const projectId = c.req.param('id');
  const configId = c.req.param('configId');
  const userId = c.get('userId');
  if (!projectId || !configId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and config id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const existing = await c.env.DB.prepare('SELECT provider_type, config_encrypted FROM provider_configs WHERE id = ? AND project_id = ?')
    .bind(configId, projectId)
    .first<{ provider_type: string; config_encrypted: string }>();
  if (!existing) {
    return c.json({ error: { code: 'not_found', message: 'Provider config not found' } }, 404);
  }

  await getProvider(existing.provider_type).validateConfig(
    {
      providerType: existing.provider_type,
      ...(JSON.parse(await decrypt(existing.config_encrypted, c.env.ENCRYPTION_KEY)) as z.infer<
        typeof createProviderConfigSchema
      >['config']),
    },
  );

  return c.json({ data: { ok: true } });
});

export { providerConfigRoutes };
