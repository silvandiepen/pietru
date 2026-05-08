import { generateId, renderTemplate } from '@pietru/core';
import { z } from 'zod';
import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { AppVariables, Env } from '../env';
import { authenticateAccountApiKey, authenticateProjectApiKey, authenticateUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

async function authenticateAccess(c: {
  req: { header(name: string): string | undefined };
  env: Env;
  set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]) => void;
}) {
  const authorization = c.req.header('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const rawKey = authorization.slice('Bearer '.length).trim();

    // Try project API key first
    const projectResult = await authenticateProjectApiKey(c, rawKey);
    if (!(projectResult instanceof Response)) {
      return projectResult;
    }

    // Try account API key
    const accountResult = await authenticateAccountApiKey(c, rawKey);
    if (!(accountResult instanceof Response)) {
      return accountResult;
    }

    return projectResult; // Return the error
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

async function verifyProjectOwnership(db: D1Database, projectId: string, userId: string) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, userId).first<{ id: string }>();
}

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1),
  html: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).optional(),
  html: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

const templateRoutes = new Hono<App>();

// List templates
templateRoutes.get('/projects/:projectId/templates', async (c) => {
  const projectId = c.req.param('projectId');

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  if ('userId' in authResult) {
    const owned = await verifyProjectOwnership(c.env.DB, projectId, authResult.userId);
    if (!owned) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  } else if ('projectId' in authResult) {
    if (authResult.projectId !== projectId) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  }

  const limit = Math.min(Number(c.req.query('limit') ?? 50), 100);
  const offset = Math.max(Number(c.req.query('offset') ?? 0), 0);

  const result = await c.env.DB.prepare(
    'SELECT * FROM email_templates WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
  )
    .bind(projectId, limit, offset)
    .all();

  return c.json({ data: result.results });
});

// Create template
templateRoutes.post('/projects/:projectId/templates', async (c) => {
  const projectId = c.req.param('projectId');

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  if ('userId' in authResult) {
    const owned = await verifyProjectOwnership(c.env.DB, projectId, authResult.userId);
    if (!owned) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  } else if ('projectId' in authResult) {
    if (authResult.projectId !== projectId) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  }

  const body = createTemplateSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const now = new Date().toISOString();
  const id = generateId('tpl');

  await c.env.DB.prepare(
    'INSERT INTO email_templates (id, project_id, name, description, subject, html, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, projectId, body.data.name, body.data.description ?? null, body.data.subject, body.data.html ?? null, body.data.text ?? null, now, now)
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(id).first();

  return c.json({ data: created }, 201);
});

// Get single template
templateRoutes.get('/projects/:projectId/templates/:templateId', async (c) => {
  const projectId = c.req.param('projectId');
  const templateId = c.req.param('templateId');

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  if ('userId' in authResult) {
    const owned = await verifyProjectOwnership(c.env.DB, projectId, authResult.userId);
    if (!owned) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  } else if ('projectId' in authResult) {
    if (authResult.projectId !== projectId) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  }

  const template = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ? AND project_id = ?')
    .bind(templateId, projectId)
    .first();

  if (!template) {
    return c.json({ error: { code: 'not_found', message: 'Template not found' } }, 404);
  }

  return c.json({ data: template });
});

// Update template
templateRoutes.patch('/projects/:projectId/templates/:templateId', async (c) => {
  const projectId = c.req.param('projectId');
  const templateId = c.req.param('templateId');

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  if ('userId' in authResult) {
    const owned = await verifyProjectOwnership(c.env.DB, projectId, authResult.userId);
    if (!owned) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  } else if ('projectId' in authResult) {
    if (authResult.projectId !== projectId) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  }

  const existing = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ? AND project_id = ?')
    .bind(templateId, projectId)
    .first();

  if (!existing) {
    return c.json({ error: { code: 'not_found', message: 'Template not found' } }, 404);
  }

  const body = updateTemplateSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const now = new Date().toISOString();
  const updates = body.data;
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.subject !== undefined) {
    fields.push('subject = ?');
    values.push(updates.subject);
  }
  if (updates.html !== undefined) {
    fields.push('html = ?');
    values.push(updates.html);
  }
  if (updates.text !== undefined) {
    fields.push('text = ?');
    values.push(updates.text);
  }

  if (fields.length === 0) {
    return c.json({ data: existing });
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(templateId);

  await c.env.DB.prepare(`UPDATE email_templates SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(templateId).first();

  return c.json({ data: updated });
});

// Delete template
templateRoutes.delete('/projects/:projectId/templates/:templateId', async (c) => {
  const projectId = c.req.param('projectId');
  const templateId = c.req.param('templateId');

  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  if ('userId' in authResult) {
    const owned = await verifyProjectOwnership(c.env.DB, projectId, authResult.userId);
    if (!owned) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  } else if ('projectId' in authResult) {
    if (authResult.projectId !== projectId) {
      return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
    }
  }

  const existing = await c.env.DB.prepare('SELECT * FROM email_templates WHERE id = ? AND project_id = ?')
    .bind(templateId, projectId)
    .first();

  if (!existing) {
    return c.json({ error: { code: 'not_found', message: 'Template not found' } }, 404);
  }

  await c.env.DB.prepare('DELETE FROM email_templates WHERE id = ?').bind(templateId).run();

  return c.json({ data: { deleted: true } });
});

export { templateRoutes };
