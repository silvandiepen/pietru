import { generateId } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const createReservedSchema = z.object({
  localPart: z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9._-]*$/i, 'Must start with alphanumeric, only letters, numbers, dots, hyphens, underscores'),
  description: z.string().max(255).optional(),
  adminProjectId: z.string().min(1),
});

const updateReservedSchema = z.object({
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

const reservedRoutes = new Hono<App>();
reservedRoutes.use('*', requireUserSession);

// List all reserved addresses
reservedRoutes.get('/admin/reserved-addresses', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  // Only admins can manage reserved addresses
  const user = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(userId)
    .first<{ is_admin: number }>();

  if (!user || !user.is_admin) {
    return c.json({ error: { code: 'forbidden', message: 'Admin access required' } }, 403);
  }

  const result = await c.env.DB.prepare(
    'SELECT id, local_part, description, admin_project_id, is_active, created_at, updated_at FROM reserved_addresses ORDER BY created_at DESC',
  ).all();

  return c.json({ data: result.results });
});

// Create a reserved address
reservedRoutes.post('/admin/reserved-addresses', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const user = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(userId)
    .first<{ is_admin: number }>();

  if (!user || !user.is_admin) {
    return c.json({ error: { code: 'forbidden', message: 'Admin access required' } }, 403);
  }

  const body = createReservedSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const localPart = body.data.localPart.toLowerCase().trim();

  // Check for duplicates
  const existing = await c.env.DB.prepare('SELECT id FROM reserved_addresses WHERE local_part = ?')
    .bind(localPart)
    .first<{ id: string }>();
  if (existing) {
    return c.json({ error: { code: 'conflict', message: `Address "${localPart}" is already reserved` } }, 409);
  }

  // Verify admin project exists
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?')
    .bind(body.data.adminProjectId)
    .first<{ id: string }>();
  if (!project) {
    return c.json({ error: { code: 'not_found', message: 'Admin project not found' } }, 404);
  }

  const now = new Date().toISOString();
  const id = generateId('rsv');
  await c.env.DB.prepare(
    'INSERT INTO reserved_addresses (id, local_part, description, admin_project_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
  )
    .bind(id, localPart, body.data.description ?? null, body.data.adminProjectId, now, now)
    .run();

  return c.json({
    data: {
      id,
      local_part: localPart,
      description: body.data.description ?? null,
      admin_project_id: body.data.adminProjectId,
      is_active: 1,
      created_at: now,
      updated_at: now,
    },
  }, 201);
});

// Update a reserved address (toggle active, change description)
reservedRoutes.patch('/admin/reserved-addresses/:id', async (c) => {
  const userId = c.get('userId');
  const addressId = c.req.param('id');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const user = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(userId)
    .first<{ is_admin: number }>();

  if (!user || !user.is_admin) {
    return c.json({ error: { code: 'forbidden', message: 'Admin access required' } }, 403);
  }

  const body = updateReservedSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM reserved_addresses WHERE id = ?')
    .bind(addressId)
    .first<{ id: string }>();
  if (!existing) {
    return c.json({ error: { code: 'not_found', message: 'Reserved address not found' } }, 404);
  }

  const updatedAt = new Date().toISOString();
  if (body.data.description !== undefined) {
    await c.env.DB.prepare('UPDATE reserved_addresses SET description = ?, updated_at = ? WHERE id = ?')
      .bind(body.data.description, updatedAt, addressId)
      .run();
  }
  if (body.data.isActive !== undefined) {
    await c.env.DB.prepare('UPDATE reserved_addresses SET is_active = ?, updated_at = ? WHERE id = ?')
      .bind(body.data.isActive ? 1 : 0, updatedAt, addressId)
      .run();
  }

  return c.json({ data: { id: addressId, updated_at: updatedAt } });
});

// Delete a reserved address
reservedRoutes.delete('/admin/reserved-addresses/:id', async (c) => {
  const userId = c.get('userId');
  const addressId = c.req.param('id');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const user = await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?')
    .bind(userId)
    .first<{ is_admin: number }>();

  if (!user || !user.is_admin) {
    return c.json({ error: { code: 'forbidden', message: 'Admin access required' } }, 403);
  }

  await c.env.DB.prepare('DELETE FROM reserved_addresses WHERE id = ?')
    .bind(addressId)
    .run();

  return c.json({ data: { ok: true } });
});

export { reservedRoutes };
