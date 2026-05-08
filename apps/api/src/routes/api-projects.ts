import { generateApiKey } from '@pietru/auth';
import { generateId, slugify } from '@pietru/core';
import { z } from 'zod';
import { Hono } from 'hono';
import type { Env, AppVariables } from '../env';
import { requireAccountApiKey } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

const createApiProjectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  environment: z.enum(['development', 'preview', 'production']).default('development'),
});

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

const apiProjectsRoutes = new Hono<App>();

apiProjectsRoutes.post('/api/projects', requireAccountApiKey, async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user identity' } }, 401);
  }

  const body = createApiProjectSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const { name, environment } = body.data;
  const now = new Date().toISOString();
  const slug = await ensureUniqueSlug(c.env.DB, slugify(body.data.slug ?? name));
  const projectId = generateId('proj');

  // Create the project
  const project = {
    id: projectId,
    user_id: userId,
    name,
    slug,
    created_at: now,
    updated_at: now,
  };

  await c.env.DB.prepare(
    'INSERT INTO projects (id, user_id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(project.id, project.user_id, project.name, project.slug, project.created_at, project.updated_at)
    .run();

  // Auto-provision provider config if user has default Resend API key
  const userSettings = await c.env.DB.prepare(
    'SELECT default_resend_api_key_encrypted, default_from_address FROM user_settings WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ default_resend_api_key_encrypted: string | null; default_from_address: string | null }>();

  if (userSettings?.default_resend_api_key_encrypted) {
    const mode = environment === 'production' ? 'send' : 'capture';
    const providerConfigId = generateId('pcfg');

    // The encrypted API key is already encrypted, store it directly
    await c.env.DB.prepare(
      'INSERT INTO provider_configs (id, project_id, provider_type, config_encrypted, mode, environment, default_from, allowed_domains_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        providerConfigId,
        projectId,
        'resend',
        userSettings.default_resend_api_key_encrypted,
        mode,
        environment,
        userSettings.default_from_address ?? null,
        JSON.stringify([]),
        now,
        now,
      )
      .run();
  }

  // Auto-generate project API keys for the requested environment
  const generatedKey = await generateApiKey(environment);
  const apiKeyId = generateId('pak');
  await c.env.DB.prepare(
    'INSERT INTO project_api_keys (id, project_id, name, key_prefix, key_hash, environment, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
  )
    .bind(apiKeyId, projectId, `Auto-generated ${environment} key`, generatedKey.prefix, generatedKey.hash, environment, now)
    .run();

  return c.json(
    {
      data: {
        ...project,
        environment,
        projectApiKeys: [
          {
            id: apiKeyId,
            key: generatedKey.key,
            keyPrefix: generatedKey.prefix,
            environment,
            createdAt: now,
          },
        ],
      },
    },
    201,
  );
});

export { apiProjectsRoutes };
