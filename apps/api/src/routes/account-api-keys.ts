import { generateAccountApiKey } from '@pietru/auth';
import { generateId } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const createAccountKeySchema = z.object({
  name: z.string().optional(),
});

const accountApiKeysRoutes = new Hono<App>();

accountApiKeysRoutes.get('/account/api-keys', requireUserSession, async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const result = await c.env.DB.prepare(
    'SELECT id, name, key_prefix, created_at, revoked_at FROM account_api_keys WHERE user_id = ? ORDER BY created_at DESC',
  )
    .bind(userId)
    .all();

  return c.json({ data: result.results });
});

accountApiKeysRoutes.post('/account/api-keys', requireUserSession, async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const body = createAccountKeySchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const generated = await generateAccountApiKey();
  const now = new Date().toISOString();
  const id = generateId('aak');
  await c.env.DB.prepare(
    'INSERT INTO account_api_keys (id, user_id, name, key_prefix, key_hash, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, NULL)',
  )
    .bind(id, userId, body.data.name ?? null, generated.prefix, generated.hash, now)
    .run();

  return c.json(
    {
      data: {
        id,
        key: generated.key,
        keyPrefix: generated.prefix,
        createdAt: now,
      },
    },
    201,
  );
});

accountApiKeysRoutes.delete('/account/api-keys/:keyId', requireUserSession, async (c) => {
  const userId = c.get('userId');
  const keyId = c.req.param('keyId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }
  if (!keyId) {
    return c.json({ error: { code: 'validation_error', message: 'Key id is required' } }, 400);
  }

  const result = await c.env.DB.prepare(
    'UPDATE account_api_keys SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
  )
    .bind(new Date().toISOString(), keyId, userId)
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: { code: 'not_found', message: 'API key not found' } }, 404);
  }

  return c.json({ data: { ok: true } });
});

export { accountApiKeysRoutes };
