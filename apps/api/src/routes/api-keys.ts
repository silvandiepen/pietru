import { generateApiKey } from '@pietru/auth';
import { generateId } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const createApiKeySchema = z.object({
  name: z.string().optional(),
  environment: z.enum(['development', 'preview', 'production']),
});

const apiKeyRoutes = new Hono<App>();
apiKeyRoutes.use('*', requireUserSession);

async function ensureOwnedProject(db: D1Database, projectId: string, userId: string) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first<{ id: string }>();
}

apiKeyRoutes.get('/projects/:id/api-keys', async (c) => {
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
    'SELECT id, name, key_prefix, environment, created_at, revoked_at FROM project_api_keys WHERE project_id = ? ORDER BY created_at DESC',
  )
    .bind(projectId)
    .all();

  return c.json({ data: result.results });
});

apiKeyRoutes.post('/projects/:id/api-keys', async (c) => {
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

  const body = createApiKeySchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const generated = await generateApiKey(body.data.environment);
  const now = new Date().toISOString();
  const id = generateId('pak');
  await c.env.DB.prepare(
    'INSERT INTO project_api_keys (id, project_id, name, key_prefix, key_hash, environment, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
  )
    .bind(id, projectId, body.data.name ?? null, generated.prefix, generated.hash, body.data.environment, now)
    .run();

  return c.json(
    {
      data: {
        id,
        key: generated.key,
        keyPrefix: generated.prefix,
        environment: body.data.environment,
        createdAt: now,
      },
    },
    201,
  );
});

apiKeyRoutes.delete('/projects/:id/api-keys/:keyId', async (c) => {
  const projectId = c.req.param('id');
  const keyId = c.req.param('keyId');
  const userId = c.get('userId');
  if (!projectId || !keyId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and key id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  const owned = await ensureOwnedProject(c.env.DB, projectId, userId);
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const result = await c.env.DB.prepare(
    'UPDATE project_api_keys SET revoked_at = ? WHERE id = ? AND project_id = ? AND revoked_at IS NULL',
  )
    .bind(new Date().toISOString(), keyId, projectId)
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: { code: 'not_found', message: 'API key not found' } }, 404);
  }

  return c.json({ data: { ok: true } });
});

export { apiKeyRoutes };
