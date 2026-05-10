import { Hono } from 'hono';
import type { AppVariables, Env } from '../env';
import { requireUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

function encodeCursor(createdAt: string, id: string): string {
  return btoa(JSON.stringify({ createdAt, id }));
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(atob(cursor)) as { createdAt: string; id: string };
  } catch {
    return null;
  }
}

const inboxRoutes = new Hono<App>();

inboxRoutes.get('/inbox', requireUserSession, async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const queryProject = c.req.query('project') ?? '';
  const queryTag = c.req.query('tag') ?? '';
  const querySearch = c.req.query('search') ?? '';
  const queryStatus = c.req.query('status') ?? '';
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const queryCursor = c.req.query('cursor');
  const decodedCursor = queryCursor ? decodeCursor(queryCursor) : null;

  const filters: unknown[] = [userId];
  let where = ' FROM messages m LEFT JOIN projects p ON p.id = m.project_id WHERE (p.user_id = ? OR m.project_id IS NULL)';

  if (queryProject) {
    // Support filtering by project slug or ID
    where += ' AND (m.project_id = ? OR p.slug = ?)';
    filters.push(queryProject, queryProject);
  }

  if (queryTag) {
    where += " AND json_extract(m.tags_json, '$.tag') = ?";
    filters.push(queryTag);
  }

  if (queryStatus) {
    where += ' AND m.status = ?';
    filters.push(queryStatus);
  }

  if (querySearch) {
    where += ' AND (m.subject LIKE ? OR m.from_address LIKE ? OR m.to_address LIKE ?)';
    const searchPattern = `%${querySearch}%`;
    filters.push(searchPattern, searchPattern, searchPattern);
  }

  if (decodedCursor) {
    where += ' AND (m.created_at < ? OR (m.created_at = ? AND m.id < ?))';
    filters.push(decodedCursor.createdAt, decodedCursor.createdAt, decodedCursor.id);
  }

  const result = await c.env.DB.prepare(`SELECT m.* ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`)
    .bind(...filters, limit + 1)
    .all<Record<string, unknown>>();

  const items = result.results.slice(0, limit);
  const nextCursor =
    result.results.length > limit && items.length > 0
      ? encodeCursor(String(items[items.length - 1].created_at), String(items[items.length - 1].id))
      : null;

  return c.json({ data: { items, nextCursor } });
});

inboxRoutes.get('/inbox/:id', requireUserSession, async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing user session' } }, 401);
  }

  const messageId = c.req.param('id');
  if (!messageId) {
    return c.json({ error: { code: 'validation_error', message: 'Message id is required' } }, 400);
  }

  const message = await c.env.DB.prepare(
    'SELECT m.* FROM messages m INNER JOIN projects p ON p.id = m.project_id WHERE m.id = ? AND p.user_id = ?',
  )
    .bind(messageId, userId)
    .first<Record<string, unknown>>();

  if (!message) {
    return c.json({ error: { code: 'not_found', message: 'Message not found' } }, 404);
  }

  const events = await c.env.DB.prepare('SELECT * FROM message_events WHERE message_id = ? ORDER BY created_at ASC')
    .bind(messageId)
    .all();

  return c.json({ data: { ...message, events: events.results } });
});

export { inboxRoutes };
