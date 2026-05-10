import { generateId } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const MAX_ALIASES_PER_USER = 100;

const TEST_DOMAIN = 'test.pietru.dev';

// System names that cannot be claimed as aliases
const BLOCKED_NAMES = new Set([
  'admin', 'api', 'app', 'www', 'mail', 'email', 'pietru', 'root', 'noreply',
  'postmaster', 'abuse', 'spam', 'info', 'support', 'security', 'legal',
  'finance', 'accounts', 'test', 'localhost', 'example', 'invalid', 'null',
]);

const createAliasSchema = z.object({
  localPart: z
    .string()
    .min(1, 'Local part is required')
    .max(64, 'Local part too long (max 64 characters)')
    .regex(
      /^[a-z0-9][a-z0-9._-]*$/i,
      'Must start with alphanumeric. Only letters, numbers, dots, hyphens, underscores allowed.',
    ),
  projectId: z.string().min(1).optional(),
  description: z.string().max(255).optional(),
});

const updateAliasSchema = z.object({
  projectId: z.string().min(1).nullable().optional(),
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    localPart: row.local_part,
    description: row.description,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    email: `${row.local_part}@${TEST_DOMAIN}`,
  };
}

const testAliasRoutes = new Hono<App>();
testAliasRoutes.use('*', requireUserSession);

// List all aliases for the authenticated user
testAliasRoutes.get('/test-aliases', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const result = await c.env.DB.prepare(
    `SELECT ta.id, ta.user_id, ta.project_id, ta.local_part, ta.description,
            ta.is_active, ta.created_at, ta.updated_at,
            p.name as project_name, p.slug as project_slug
     FROM test_aliases ta
     LEFT JOIN projects p ON ta.project_id = p.id
     WHERE ta.user_id = ?
     ORDER BY ta.created_at DESC`,
  )
    .bind(userId)
    .all();

  const aliases = result.results.map((row) => ({
    ...toCamel(row as Record<string, unknown>),
    projectName: (row as Record<string, unknown>).project_name,
    projectSlug: (row as Record<string, unknown>).project_slug,
  }));

  // Include count towards limit
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM test_aliases WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ total: number }>();

  return c.json({
    data: {
      aliases,
      count: countResult?.total ?? 0,
      limit: MAX_ALIASES_PER_USER,
    },
  });
});

// Create a new test alias
testAliasRoutes.post('/test-aliases', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const body = await c.req.json();
  const parsed = createAliasSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: { code: 'validation_error', message: parsed.error.issues[0].message } },
      400,
    );
  }

  const localPart = parsed.data.localPart.toLowerCase().trim();

  // Block system names
  if (BLOCKED_NAMES.has(localPart)) {
    return c.json(
      { error: { code: 'validation_error', message: `"${localPart}" is a reserved name and cannot be used.` } },
      400,
    );
  }

  // Check alias count
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM test_aliases WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ total: number }>();

  if ((countResult?.total ?? 0) >= MAX_ALIASES_PER_USER) {
    return c.json(
      { error: { code: 'limit_reached', message: `Maximum of ${MAX_ALIASES_PER_USER} aliases reached.` } },
      400,
    );
  }

  // Check local_part uniqueness
  const existing = await c.env.DB.prepare(
    'SELECT id FROM test_aliases WHERE local_part = ?',
  )
    .bind(localPart)
    .first<{ id: string }>();

  if (existing) {
    return c.json(
      { error: { code: 'conflict', message: `"${localPart}@${TEST_DOMAIN}" is already taken.` } },
      409,
    );
  }

  // Validate project ownership if provided
  let projectId: string | null = parsed.data.projectId ?? null;
  if (projectId) {
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
    )
      .bind(projectId, userId)
      .first<{ id: string }>();

    if (!project) {
      return c.json(
        { error: { code: 'not_found', message: 'Project not found or you do not have access to it.' } },
        404,
      );
    }
  }

  const id = generateId('ta');
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO test_aliases (id, user_id, project_id, local_part, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
  ).bind(id, userId, projectId, localPart, parsed.data.description ?? null, now, now).run();

  return c.json({
    data: {
      id,
      userId,
      projectId,
      localPart,
      description: parsed.data.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      email: `${localPart}@${TEST_DOMAIN}`,
    },
  }, 201);
});

// Update a test alias
testAliasRoutes.patch('/test-aliases/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const aliasId = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateAliasSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: { code: 'validation_error', message: parsed.error.issues[0].message } },
      400,
    );
  }

  // Verify ownership
  const alias = await c.env.DB.prepare(
    'SELECT id, user_id FROM test_aliases WHERE id = ?',
  )
    .bind(aliasId)
    .first<{ id: string; user_id: string }>();

  if (!alias || alias.user_id !== userId) {
    return c.json(
      { error: { code: 'not_found', message: 'Alias not found.' } },
      404,
    );
  }

  // Validate project ownership if changing
  if (parsed.data.projectId !== undefined) {
    const projectId = parsed.data.projectId;
    if (projectId) {
      const project = await c.env.DB.prepare(
        'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      )
        .bind(projectId, userId)
        .first<{ id: string }>();

      if (!project) {
        return c.json(
          { error: { code: 'not_found', message: 'Project not found or you do not have access to it.' } },
          404,
        );
      }
    }
  }

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (parsed.data.projectId !== undefined) {
    updates.push('project_id = ?');
    values.push(parsed.data.projectId);
  }
  if (parsed.data.description !== undefined) {
    updates.push('description = ?');
    values.push(parsed.data.description);
  }
  if (parsed.data.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(parsed.data.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: { code: 'validation_error', message: 'No fields to update.' } }, 400);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(aliasId);

  await c.env.DB.prepare(
    `UPDATE test_aliases SET ${updates.join(', ')} WHERE id = ?`,
  ).bind(...values).run();

  // Return updated alias
  const updated = await c.env.DB.prepare(
    `SELECT ta.id, ta.user_id, ta.project_id, ta.local_part, ta.description,
            ta.is_active, ta.created_at, ta.updated_at,
            p.name as project_name, p.slug as project_slug
     FROM test_aliases ta
     LEFT JOIN projects p ON ta.project_id = p.id
     WHERE ta.id = ?`,
  )
    .bind(aliasId)
    .first();

  return c.json({
    data: updated ? toCamel(updated as Record<string, unknown>) : null,
  });
});

// Delete a test alias
testAliasRoutes.delete('/test-aliases/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const aliasId = c.req.param('id');

  const alias = await c.env.DB.prepare(
    'SELECT id, user_id FROM test_aliases WHERE id = ?',
  )
    .bind(aliasId)
    .first<{ id: string; user_id: string }>();

  if (!alias || alias.user_id !== userId) {
    return c.json(
      { error: { code: 'not_found', message: 'Alias not found.' } },
      404,
    );
  }

  await c.env.DB.prepare('DELETE FROM test_aliases WHERE id = ?').bind(aliasId).run();

  return c.json({ data: { deleted: true } });
});

export { testAliasRoutes };
