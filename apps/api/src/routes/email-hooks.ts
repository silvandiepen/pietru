import { generateId } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const FILTER_TYPES = ['tag', 'from_domain', 'subject_regex', 'any'] as const;

const createEmailHookSchema = z.object({
  name: z.string().min(1).max(255),
  filter_type: z.enum(FILTER_TYPES),
  filter_value: z.string().nullable().optional(),
  webhook_url: z.string().url(),
  webhook_secret: z.string().nullable().optional(),
  webhook_headers_json: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const updateEmailHookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  filter_type: z.enum(FILTER_TYPES).optional(),
  filter_value: z.string().nullable().optional(),
  webhook_url: z.string().url().optional(),
  webhook_secret: z.string().nullable().optional(),
  webhook_headers_json: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const emailHookRoutes = new Hono<App>();

// List email hooks for a project
emailHookRoutes.get('/projects/:id/email-hooks', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, userId)
    .first<{ id: string }>();
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const result = await c.env.DB.prepare(
    'SELECT id, project_id, name, is_active, filter_type, filter_value, webhook_url, webhook_secret, webhook_headers_json, created_at, updated_at FROM email_hooks WHERE project_id = ? ORDER BY created_at DESC',
  )
    .bind(projectId)
    .all();

  const hooks = result.results.map((row) => ({
    ...row,
    is_active: row.is_active === 1,
  }));

  return c.json({ data: hooks });
});

// Create an email hook for a project
emailHookRoutes.post('/projects/:id/email-hooks', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, userId)
    .first<{ id: string }>();
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const body = createEmailHookSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const now = new Date().toISOString();
  const id = generateId('hook');
  const isActive = body.data.is_active !== undefined ? body.data.is_active : true;

  await c.env.DB.prepare(
    'INSERT INTO email_hooks (id, project_id, name, is_active, filter_type, filter_value, webhook_url, webhook_secret, webhook_headers_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      projectId,
      body.data.name,
      isActive ? 1 : 0,
      body.data.filter_type,
      body.data.filter_value ?? null,
      body.data.webhook_url,
      body.data.webhook_secret ?? null,
      body.data.webhook_headers_json ?? null,
      now,
      now,
    )
    .run();

  return c.json(
    {
      data: {
        id,
        project_id: projectId,
        name: body.data.name,
        is_active: isActive,
        filter_type: body.data.filter_type,
        filter_value: body.data.filter_value ?? null,
        webhook_url: body.data.webhook_url,
        webhook_secret: body.data.webhook_secret ?? null,
        webhook_headers_json: body.data.webhook_headers_json ?? null,
        created_at: now,
        updated_at: now,
      },
    },
    201,
  );
});

// Update an email hook
emailHookRoutes.patch('/projects/:id/email-hooks/:hookId', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const hookId = c.req.param('hookId');
  const userId = c.get('userId');
  if (!projectId || !hookId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and hook id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, userId)
    .first<{ id: string }>();
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const body = updateEmailHookSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const data = body.data;
  const now = new Date().toISOString();

  // Build dynamic UPDATE
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.filter_type !== undefined) { fields.push('filter_type = ?'); values.push(data.filter_type); }
  if (data.filter_value !== undefined) { fields.push('filter_value = ?'); values.push(data.filter_value); }
  if (data.webhook_url !== undefined) { fields.push('webhook_url = ?'); values.push(data.webhook_url); }
  if (data.webhook_secret !== undefined) { fields.push('webhook_secret = ?'); values.push(data.webhook_secret); }
  if (data.webhook_headers_json !== undefined) { fields.push('webhook_headers_json = ?'); values.push(data.webhook_headers_json); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

  if (fields.length === 0) {
    return c.json({ error: { code: 'validation_error', message: 'No fields to update' } }, 400);
  }

  fields.push('updated_at = ?');
  values.push(now);

  const sql = `UPDATE email_hooks SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`;
  values.push(hookId, projectId);

  await c.env.DB.prepare(sql).bind(...values).run();

  // Fetch and return updated hook
  const updated = await c.env.DB.prepare(
    'SELECT id, project_id, name, is_active, filter_type, filter_value, webhook_url, webhook_secret, webhook_headers_json, created_at, updated_at FROM email_hooks WHERE id = ? AND project_id = ?',
  )
    .bind(hookId, projectId)
    .first();

  if (!updated) {
    return c.json({ error: { code: 'not_found', message: 'Hook not found' } }, 404);
  }

  return c.json({
    data: {
      ...updated,
      is_active: updated.is_active === 1,
    },
  });
});

// Delete an email hook
emailHookRoutes.delete('/projects/:id/email-hooks/:hookId', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const hookId = c.req.param('hookId');
  const userId = c.get('userId');
  if (!projectId || !hookId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and hook id are required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, userId)
    .first<{ id: string }>();
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  await c.env.DB.prepare('DELETE FROM email_hooks WHERE id = ? AND project_id = ?')
    .bind(hookId, projectId)
    .run();

  return c.json({ data: { ok: true } });
});

export { emailHookRoutes };
