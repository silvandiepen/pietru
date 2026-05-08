import { generateId, slugify } from '@pietru/core';
import { createProjectSchema, updateProjectSchema } from '@pietru/validation';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

async function ensureUniqueSlug(db: D1Database, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await db.prepare('SELECT id FROM projects WHERE slug = ?').bind(slug).first<{ id: string }>();
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

const projectRoutes = new Hono<App>();
projectRoutes.use('*', requireUserSession);

projectRoutes.get('/', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
    .bind(c.get('userId'))
    .all();
  return c.json({ data: result.results });
});

projectRoutes.post('/', async (c) => {
  const body = createProjectSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const now = new Date().toISOString();
  const slug = await ensureUniqueSlug(c.env.DB, slugify(body.data.slug ?? body.data.name));
  const project = {
    id: generateId('proj'),
    user_id: c.get('userId'),
    name: body.data.name,
    slug,
    created_at: now,
    updated_at: now,
  };

  await c.env.DB.prepare(
    'INSERT INTO projects (id, user_id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(project.id, project.user_id, project.name, project.slug, project.created_at, project.updated_at)
    .run();

  return c.json({ data: project }, 201);
});

projectRoutes.get('/:id', async (c) => {
  const projectId = c.req.param('id');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, c.get('userId'))
    .first();

  if (!project) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  return c.json({ data: project });
});

projectRoutes.patch('/:id', async (c) => {
  const projectId = c.req.param('id');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  const body = updateProjectSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, c.get('userId'))
    .first<{ id: string; name: string; slug: string }>();

  if (!project) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const slug = body.data.slug ? await ensureUniqueSlug(c.env.DB, slugify(body.data.slug)) : project.slug;
  const updatedAt = new Date().toISOString();
  await c.env.DB.prepare('UPDATE projects SET name = ?, slug = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(body.data.name ?? project.name, slug, updatedAt, projectId, c.get('userId'))
    .run();

  return c.json({ data: { ...project, name: body.data.name ?? project.name, slug, updated_at: updatedAt } });
});

projectRoutes.delete('/:id', async (c) => {
  const projectId = c.req.param('id');
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'Project id is required' } }, 400);
  }
  const result = await c.env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, c.get('userId'))
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  return c.json({ data: { ok: true } });
});

export { projectRoutes };
