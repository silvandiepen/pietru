import { generateId, safeJsonParse, sendSystemEmail, slugify } from '@pietru/core';
import { createMailingListSchema, subscribeSchema, updateMailingListSchema } from '@pietru/validation';
import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../env';
import { authenticateProjectApiKey, authenticateUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

export const mailingListRoutes = new Hono<App>();

// ── Helpers ────────────────────────────────────────────────────────────

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function parseMeta(value: string | null | undefined): Record<string, unknown> | null {
  return safeJsonParse<Record<string, unknown> | null>(value, null);
}

interface MailingListRow {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string | null;
  meta: string | null;
  confirmation_email_from: string | null;
  confirmation_email_subject: string | null;
  confirmation_success_url: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

function formatList(row: MailingListRow, subscriberCount?: number) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    meta: parseMeta(row.meta),
    confirmationEmailFrom: row.confirmation_email_from,
    confirmationEmailSubject: row.confirmation_email_subject,
    confirmationSuccessUrl: row.confirmation_success_url,
    ...(subscriberCount !== undefined ? { subscriberCount } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface SubscriberRow {
  id: string;
  mailing_list_id: string;
  email: string;
  name: string | null;
  meta: string | null;
  status: string;
  subscribed_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

function formatSubscriber(row: SubscriberRow) {
  return {
    id: row.id,
    mailingListId: row.mailing_list_id,
    email: row.email,
    name: row.name,
    meta: parseMeta(row.meta),
    status: row.status,
    subscribedAt: row.subscribed_at,
    confirmedAt: row.confirmed_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
  };
}

async function verifyListOwnership(c: { env: Env; get: <K extends keyof AppVariables>(key: K) => AppVariables[K] }, listId: string) {
  const userId = c.get('userId')!;
  const list = await c.env.DB.prepare(
    'SELECT ml.* FROM mailing_lists ml JOIN projects p ON ml.project_id = p.id WHERE ml.id = ? AND p.user_id = ? AND ml.deleted_at IS NULL',
  )
    .bind(listId, userId)
    .first<MailingListRow>();
  return list;
}

// ── Auth middlewares ───────────────────────────────────────────────────

const requireUserSessionLocal = createMiddleware<App>(async (c, next) => {
  const token = getCookie(c, 'session');
  if (!token) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing session cookie' } }, 401);
  }
  const result = await authenticateUserSession(c, token);
  if (result instanceof Response) return result;
  await next();
});

const requireApiKeyOrSession = createMiddleware<App>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const result = await authenticateProjectApiKey(c, authorization.slice('Bearer '.length).trim());
    if (!(result instanceof Response)) {
      await next();
      return;
    }
  }

  const token = getCookie(c, 'session');
  if (token) {
    const result = await authenticateUserSession(c, token);
    if (!(result instanceof Response)) {
      await next();
      return;
    }
  }

  return c.json({ error: { code: 'unauthorized', message: 'Missing API key or session cookie' } }, 401);
});

// ── Routes ─────────────────────────────────────────────────────────────

// a) GET /mailing-lists — List all mailing lists for user's projects
mailingListRoutes.get('/mailing-lists', requireUserSessionLocal, async (c) => {
  const userId = c.get('userId')!;

  const lists = await c.env.DB.prepare(
    `SELECT ml.*, COUNT(CASE WHEN mls.status IN ('pending', 'confirmed') THEN 1 END) AS subscriber_count
     FROM mailing_lists ml
     JOIN projects p ON ml.project_id = p.id
     LEFT JOIN mailing_list_subscribers mls ON mls.mailing_list_id = ml.id
     WHERE p.user_id = ? AND ml.deleted_at IS NULL
     GROUP BY ml.id
     ORDER BY ml.created_at DESC`,
  )
    .bind(userId)
    .all<MailingListRow & { subscriber_count: number }>();

  return c.json({
    data: lists.results.map((row) => formatList(row, row.subscriber_count)),
  });
});

// b) POST /mailing-lists — Create a mailing list
mailingListRoutes.post('/mailing-lists', requireUserSessionLocal, async (c) => {
  const userId = c.get('userId')!;
  const rawBody = await c.req.json().catch(() => null) as Record<string, unknown> | null;

  const body = createMailingListSchema.safeParse(rawBody);
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const projectId = rawBody?.projectId as string | undefined;
  if (!projectId) {
    return c.json({ error: { code: 'validation_error', message: 'projectId is required' } }, 400);
  }

  const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .bind(projectId, userId)
    .first<{ id: string }>();
  if (!owned) {
    return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
  }

  const now = new Date().toISOString();
  const id = generateId('ml');
  const listSlug = body.data.slug ? slugify(body.data.slug) : slugify(body.data.name);
  const meta = body.data.meta ? JSON.stringify(body.data.meta) : null;

  const existing = await c.env.DB.prepare(
    'SELECT id FROM mailing_lists WHERE project_id = ? AND slug = ? AND deleted_at IS NULL',
  )
    .bind(projectId, listSlug)
    .first<{ id: string }>();

  if (existing) {
    return c.json({ error: { code: 'conflict', message: 'A mailing list with this slug already exists in this project' } }, 409);
  }

  await c.env.DB.prepare(
    `INSERT INTO mailing_lists (id, project_id, name, slug, description, meta, confirmation_email_from, confirmation_email_subject, confirmation_success_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      projectId,
      body.data.name,
      listSlug,
      body.data.description ?? null,
      meta,
      body.data.confirmationEmailFrom ?? null,
      body.data.confirmationEmailSubject ?? null,
      body.data.confirmationSuccessUrl ?? null,
      now,
    )
    .run();

  const list = await c.env.DB.prepare('SELECT * FROM mailing_lists WHERE id = ?').bind(id).first<MailingListRow>();

  return c.json({ data: formatList(list!) }, 201);
});

// c) GET /mailing-lists/:listId — Single list with subscriber counts
mailingListRoutes.get('/mailing-lists/:listId', requireUserSessionLocal, async (c) => {
  const listId = c.req.param('listId');
  const list = await verifyListOwnership(c, listId);
  if (!list) {
    return c.json({ error: { code: 'not_found', message: 'Mailing list not found' } }, 404);
  }

  const counts = await c.env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM mailing_list_subscribers WHERE mailing_list_id = ? GROUP BY status',
  )
    .bind(listId)
    .all<{ status: string; count: number }>();

  const subscriberCounts: Record<string, number> = {};
  for (const row of counts.results) {
    subscriberCounts[row.status] = row.count;
  }

  return c.json({
    data: {
      ...formatList(list),
      subscriberCounts,
    },
  });
});

// d) PATCH /mailing-lists/:listId — Update a mailing list
mailingListRoutes.patch('/mailing-lists/:listId', requireUserSessionLocal, async (c) => {
  const listId = c.req.param('listId');
  const list = await verifyListOwnership(c, listId);
  if (!list) {
    return c.json({ error: { code: 'not_found', message: 'Mailing list not found' } }, 404);
  }

  const body = updateMailingListSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const data = body.data;
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.meta !== undefined) { fields.push('meta = ?'); values.push(JSON.stringify(data.meta)); }
  if (data.confirmationEmailFrom !== undefined) { fields.push('confirmation_email_from = ?'); values.push(data.confirmationEmailFrom); }
  if (data.confirmationEmailSubject !== undefined) { fields.push('confirmation_email_subject = ?'); values.push(data.confirmationEmailSubject); }
  if (data.confirmationSuccessUrl !== undefined) { fields.push('confirmation_success_url = ?'); values.push(data.confirmationSuccessUrl); }

  if (fields.length === 0) {
    return c.json({ error: { code: 'validation_error', message: 'No fields to update' } }, 400);
  }

  fields.push('updated_at = ?');
  values.push(now);

  values.push(listId);
  const sql = `UPDATE mailing_lists SET ${fields.join(', ')} WHERE id = ?`;
  await c.env.DB.prepare(sql).bind(...values).run();

  const updated = await c.env.DB.prepare('SELECT * FROM mailing_lists WHERE id = ?').bind(listId).first<MailingListRow>();
  return c.json({ data: formatList(updated!) });
});

// e) DELETE /mailing-lists/:listId — Soft delete
mailingListRoutes.delete('/mailing-lists/:listId', requireUserSessionLocal, async (c) => {
  const listId = c.req.param('listId');
  const list = await verifyListOwnership(c, listId);
  if (!list) {
    return c.json({ error: { code: 'not_found', message: 'Mailing list not found' } }, 404);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare('UPDATE mailing_lists SET deleted_at = ? WHERE id = ?').bind(now, listId).run();

  return c.json({ data: { ok: true } });
});

// f) GET /mailing-lists/:listId/subscribers — List subscribers
mailingListRoutes.get('/mailing-lists/:listId/subscribers', requireUserSessionLocal, async (c) => {
  const listId = c.req.param('listId');
  const list = await verifyListOwnership(c, listId);
  if (!list) {
    return c.json({ error: { code: 'not_found', message: 'Mailing list not found' } }, 404);
  }

  const status = c.req.query('status');
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? '50'), 1), 200);
  const offset = Math.max(Number(c.req.query('offset') ?? '0'), 0);

  let countSql = 'SELECT COUNT(*) as total FROM mailing_list_subscribers WHERE mailing_list_id = ?';
  let sql = 'SELECT * FROM mailing_list_subscribers WHERE mailing_list_id = ?';
  const bindValues: unknown[] = [listId];
  const countBindValues: unknown[] = [listId];

  if (status) {
    countSql += ' AND status = ?';
    sql += ' AND status = ?';
    bindValues.push(status);
    countBindValues.push(status);
  }

  sql += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
  bindValues.push(limit, offset);

  const [countResult, subscribersResult] = await Promise.all([
    c.env.DB.prepare(countSql).bind(...countBindValues).first<{ total: number }>(),
    c.env.DB.prepare(sql).bind(...bindValues).all<SubscriberRow>(),
  ]);

  return c.json({
    data: {
      subscribers: subscribersResult.results.map(formatSubscriber),
      total: countResult?.total ?? 0,
    },
  });
});

// g) POST /mailing-lists/:listId/subscribers — Subscribe (public, API key or session)
mailingListRoutes.post('/mailing-lists/:listId/subscribers', requireApiKeyOrSession, async (c) => {
  const listId = c.req.param('listId');

  const list = await c.env.DB.prepare(
    'SELECT * FROM mailing_lists WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(listId)
    .first<MailingListRow>();

  if (!list) {
    return c.json({ error: { code: 'not_found', message: 'Mailing list not found' } }, 404);
  }

  const body = subscribeSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: { code: 'validation_error', message: body.error.issues[0]?.message ?? 'Invalid payload' } }, 400);
  }

  const { email, name, meta } = body.data;

  // Check existing subscriber
  const existing = await c.env.DB.prepare(
    'SELECT * FROM mailing_list_subscribers WHERE mailing_list_id = ? AND email = ?',
  )
    .bind(listId, email)
    .first<SubscriberRow>();

  if (existing) {
    if (existing.status === 'confirmed') {
      return c.json({ data: formatSubscriber(existing) });
    }

    if (existing.status === 'pending') {
      const newToken = generateToken();
      const now = new Date().toISOString();
      await c.env.DB.prepare(
        'UPDATE mailing_list_subscribers SET confirmation_token = ?, name = ?, meta = ?, subscribed_at = ? WHERE id = ?',
      )
        .bind(newToken, name ?? existing.name, meta ? JSON.stringify(meta) : existing.meta, now, existing.id)
        .run();

      await sendConfirmationEmail(c, list, email, newToken);

      return c.json({ data: formatSubscriber({ ...existing, subscribed_at: now }) });
    }

    if (existing.status === 'unsubscribed') {
      const newToken = generateToken();
      const now = new Date().toISOString();
      await c.env.DB.prepare(
        `UPDATE mailing_list_subscribers SET status = 'pending', confirmation_token = ?, name = ?, meta = ?, subscribed_at = ?, confirmed_at = NULL, unsubscribed_at = NULL WHERE id = ?`,
      )
        .bind(newToken, name ?? existing.name, meta ? JSON.stringify(meta) : existing.meta, now, existing.id)
        .run();

      await sendConfirmationEmail(c, list, email, newToken);

      return c.json({ data: formatSubscriber({ ...existing, status: 'pending', subscribed_at: now, confirmed_at: null, unsubscribed_at: null }) });
    }
  }

  // New subscriber
  const id = generateId('mls');
  const confirmationToken = generateToken();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO mailing_list_subscribers (id, mailing_list_id, email, name, meta, status, confirmation_token, subscribed_at, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
  )
    .bind(id, listId, email, name ?? null, meta ? JSON.stringify(meta) : null, confirmationToken, now, now)
    .run();

  await sendConfirmationEmail(c, list, email, confirmationToken);

  return c.json(
    {
      data: {
        id,
        mailingListId: listId,
        email,
        name: name ?? null,
        meta: meta ?? null,
        status: 'pending',
        subscribedAt: now,
        confirmedAt: null,
        unsubscribedAt: null,
        createdAt: now,
      },
    },
    201,
  );
});

// h) POST /mailing-lists/subscribers/confirm — Public confirm
mailingListRoutes.post('/mailing-lists/subscribers/confirm', async (c) => {
  const body = await c.req.json().catch(() => null) as { token?: string; listId?: string } | null;
  if (!body?.token || !body?.listId) {
    return c.json({ error: { code: 'validation_error', message: 'token and listId are required' } }, 400);
  }

  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `UPDATE mailing_list_subscribers SET status = 'confirmed', confirmed_at = ? WHERE confirmation_token = ? AND mailing_list_id = ? AND status = 'pending'`,
  )
    .bind(now, body.token, body.listId)
    .run();

  if (!result.meta?.changes || Number(result.meta.changes) === 0) {
    return c.json({ error: { code: 'not_found', message: 'Invalid or expired confirmation token' } }, 404);
  }

  const list = await c.env.DB.prepare(
    'SELECT confirmation_success_url FROM mailing_lists WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(body.listId)
    .first<{ confirmation_success_url: string | null }>();

  if (list?.confirmation_success_url) {
    return c.json({ data: { redirectUrl: list.confirmation_success_url } });
  }

  return c.json({ data: { ok: true } });
});

// i) POST /mailing-lists/subscribers/unsubscribe — Public unsubscribe
mailingListRoutes.post('/mailing-lists/subscribers/unsubscribe', async (c) => {
  const body = await c.req.json().catch(() => null) as { token?: string; listId?: string } | null;
  if (!body?.token || !body?.listId) {
    return c.json({ error: { code: 'validation_error', message: 'token and listId are required' } }, 400);
  }

  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `UPDATE mailing_list_subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE confirmation_token = ? AND mailing_list_id = ? AND status = 'confirmed'`,
  )
    .bind(now, body.token, body.listId)
    .run();

  if (!result.meta?.changes || Number(result.meta.changes) === 0) {
    return c.json({ error: { code: 'not_found', message: 'Invalid or expired unsubscribe token' } }, 404);
  }

  return c.json({ data: { ok: true } });
});

// j) DELETE /mailing-lists/:listId/subscribers/:subscriberId — Hard delete
mailingListRoutes.delete('/mailing-lists/:listId/subscribers/:subscriberId', requireUserSessionLocal, async (c) => {
  const listId = c.req.param('listId');
  const subscriberId = c.req.param('subscriberId');

  const list = await verifyListOwnership(c, listId);
  if (!list) {
    return c.json({ error: { code: 'not_found', message: 'Mailing list not found' } }, 404);
  }

  await c.env.DB.prepare('DELETE FROM mailing_list_subscribers WHERE id = ? AND mailing_list_id = ?')
    .bind(subscriberId, listId)
    .run();

  return c.json({ data: { ok: true } });
});

// ── Email helper ───────────────────────────────────────────────────────

async function sendConfirmationEmail(
  c: { env: Env },
  list: MailingListRow,
  email: string,
  token: string,
) {
  const confirmUrl = `${c.env.DASHBOARD_URL}/mailing-lists/confirm?token=${encodeURIComponent(token)}&list=${encodeURIComponent(list.id)}`;
  const subject = list.confirmation_email_subject ?? `Confirm your subscription to ${list.name}`;
  try {
    await sendSystemEmail(
      { apiKey: c.env.SYSTEM_EMAIL_API_KEY, from: list.confirmation_email_from ?? c.env.SYSTEM_EMAIL_FROM },
      {
        to: email,
        subject,
        html: `<p>Please confirm your subscription to <strong>${list.name}</strong>.</p><p><a href="${confirmUrl}">Confirm subscription</a></p>`,
        text: `Please confirm your subscription to ${list.name}.\n\n${confirmUrl}`,
      },
    );
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }
}
