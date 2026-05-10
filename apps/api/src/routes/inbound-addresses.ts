import { generateId } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const createInboundAddressSchema = z.object({
  userSlug: z.string().min(1),
});

const inboundRoutes = new Hono<App>();

// List inbound addresses for a project
inboundRoutes.get('/projects/:id/inbound-addresses', requireUserSession, async (c) => {
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
    'SELECT id, project_id, user_slug, is_active, created_at, updated_at FROM inbound_addresses WHERE project_id = ? ORDER BY created_at DESC',
  )
    .bind(projectId)
    .all();

  // Include the full email address for each
  const project = await c.env.DB.prepare('SELECT slug FROM projects WHERE id = ?')
    .bind(projectId)
    .first<{ slug: string }>();

  const addresses = result.results.map((row) => ({
    ...row,
    is_active: row.is_active === 1,
    email: project ? `${project.slug}/${row.user_slug}@pietru.dev` : null,
  }));

  return c.json({ data: addresses });
});

// Create an inbound address for a project
inboundRoutes.post('/projects/:id/inbound-addresses', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const owned = await c.env.DB.prepare('SELECT id, slug FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, userId)
    .first<{ id: string; slug: string }>();
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const body = createInboundAddressSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const userSlug = body.data.userSlug.toLowerCase();

  // Check for duplicate
  const existing = await c.env.DB.prepare(
    'SELECT id FROM inbound_addresses WHERE project_id = ? AND user_slug = ?',
  )
    .bind(projectId, userSlug)
    .first<{ id: string }>();
  if (existing) {
    return c.json({ error: { code: 'conflict', message: 'This user slug already has an inbound address for this project' } }, 409);
  }

  const now = new Date().toISOString();
  const id = generateId('inb');
  await c.env.DB.prepare(
    'INSERT INTO inbound_addresses (id, project_id, user_slug, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
  )
    .bind(id, projectId, userSlug, now, now)
    .run();

  return c.json(
    {
      data: {
        id,
        project_id: projectId,
        user_slug: userSlug,
        is_active: true,
        email: `${owned.slug}/${userSlug}@pietru.dev`,
        created_at: now,
        updated_at: now,
      },
    },
    201,
  );
});

// Delete (deactivate) an inbound address
inboundRoutes.delete('/projects/:id/inbound-addresses/:addressId', requireUserSession, async (c) => {
  const projectId = c.req.param('id');
  const addressId = c.req.param('addressId');
  const userId = c.get('userId');
  if (!projectId || !addressId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id and address id are required' } }, 400);
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

  await c.env.DB.prepare('DELETE FROM inbound_addresses WHERE id = ? AND project_id = ?')
    .bind(addressId, projectId)
    .run();

  return c.json({ data: { ok: true } });
});

export { inboundRoutes };
