import { Hono } from 'hono';
import type { AppVariables, Env } from '../env';
import { getCookie } from 'hono/cookie';
import { authenticateProjectApiKey, authenticateUserSession } from '../middleware/auth';

type App = { Bindings: Env; Variables: AppVariables };

async function authenticateAccess(c: {
  req: { header(name: string): string | undefined };
  env: Env;
  set: <K extends keyof AppVariables>(key: K, value: AppVariables[K]) => void;
}) {
  const authorization = c.req.header('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authenticateProjectApiKey(c, authorization.slice('Bearer '.length).trim());
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

const statsRoutes = new Hono<App>();

statsRoutes.get('/stats', async (c) => {
  const authResult = await authenticateAccess(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  const queryProject = c.req.query('project') ?? '';
  const queryFrom = c.req.query('from');
  const queryTo = c.req.query('to');
  const queryGroupBy = c.req.query('groupBy') ?? 'day';

  if (!['day', 'month'].includes(queryGroupBy)) {
    return c.json({ error: { code: 'validation_error', message: 'groupBy must be "day" or "month"' } }, 400);
  }

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fromDate = queryFrom ? new Date(queryFrom) : defaultFrom;
  const toDate = queryTo ? new Date(queryTo) : now;

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return c.json({ error: { code: 'validation_error', message: 'Invalid date format for from/to' } }, 400);
  }

  const dateExpr = queryGroupBy === 'month' ? "strftime('%Y-%m', m.created_at)" : "DATE(m.created_at)";

  // Build WHERE clause for user's accessible messages
  if ('userId' in authResult) {
    const userId = authResult.userId;

    if (queryProject) {
      // Verify project ownership
      const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
        .bind(queryProject, userId)
        .first<{ id: string }>();
      if (!owned) {
        return c.json({ error: { code: 'not_found', message: 'Project not found' } }, 404);
      }
    }

    // Timeline query
    const timelineFilters: unknown[] = [userId, fromDate.toISOString(), toDate.toISOString()];
    let timelineWhere = `FROM messages m LEFT JOIN projects p ON p.id = m.project_id WHERE (p.user_id = ? OR m.project_id IS NULL) AND m.created_at >= ? AND m.created_at <= ?`;

    if (queryProject) {
      timelineWhere += ' AND m.project_id = ?';
      timelineFilters.push(queryProject);
    }

    const timelineQuery = `SELECT ${dateExpr} as date, m.status, COUNT(*) as count ${timelineWhere} GROUP BY date, m.status ORDER BY date ASC`;
    const timelineResult = await c.env.DB.prepare(timelineQuery)
      .bind(...timelineFilters)
      .all<{ date: string; status: string; count: number }>();

    // Build byProject (only when no specific project filter)
    let byProject: Array<{ projectId: string; projectName: string; sent: number; failed: number; captured: number; received: number }> = [];

    if (!queryProject) {
      const projectQuery = `SELECT m.project_id as projectId, p.name as projectName, m.status, COUNT(*) as count FROM messages m LEFT JOIN projects p ON p.id = m.project_id WHERE (p.user_id = ? OR m.project_id IS NULL) AND m.created_at >= ? AND m.created_at <= ? GROUP BY m.project_id, p.name, m.status`;
      const projectResult = await c.env.DB.prepare(projectQuery)
        .bind(userId, fromDate.toISOString(), toDate.toISOString())
        .all<{ projectId: string; projectName: string; status: string; count: number }>();

      const projectMap = new Map<string, { projectId: string; projectName: string; sent: number; failed: number; captured: number; received: number }>();
      for (const row of projectResult.results) {
        const key = row.projectId ?? 'unknown';
        if (!projectMap.has(key)) {
          projectMap.set(key, { projectId: row.projectId, projectName: row.projectName ?? 'Unknown', sent: 0, failed: 0, captured: 0, received: 0 });
        }
        const entry = projectMap.get(key)!;
        if (row.status === 'sent') entry.sent += row.count;
        else if (row.status === 'failed') entry.failed += row.count;
        else if (row.status === 'captured') entry.captured += row.count;
        else if (row.status === 'received') entry.received += row.count;
      }
      byProject = Array.from(projectMap.values());
    }

    // Build totals
    const totals = { sent: 0, failed: 0, captured: 0, received: 0 };
    for (const row of timelineResult.results) {
      if (row.status === 'sent') totals.sent += row.count;
      else if (row.status === 'failed') totals.failed += row.count;
      else if (row.status === 'captured') totals.captured += row.count;
      else if (row.status === 'received') totals.received += row.count;
    }

    // Build timeline with pivoted statuses
    const timelineMap = new Map<string, { date: string; sent: number; failed: number; captured: number; received: number }>();
    for (const row of timelineResult.results) {
      if (!timelineMap.has(row.date)) {
        timelineMap.set(row.date, { date: row.date, sent: 0, failed: 0, captured: 0, received: 0 });
      }
      const entry = timelineMap.get(row.date)!;
      if (row.status === 'sent') entry.sent += row.count;
      else if (row.status === 'failed') entry.failed += row.count;
      else if (row.status === 'captured') entry.captured += row.count;
      else if (row.status === 'received') entry.received += row.count;
    }
    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return c.json({
      data: {
        period: { from: fromDate.toISOString(), to: toDate.toISOString(), groupBy: queryGroupBy },
        totals,
        byProject,
        timeline,
      },
    });
  }

  // API key auth: scoped to project
  const projectId = authResult.projectId;
  const environment = authResult.environment;

  const timelineFilters: unknown[] = [projectId, fromDate.toISOString(), toDate.toISOString()];
  let timelineWhere = 'FROM messages m WHERE m.project_id = ? AND m.created_at >= ? AND m.created_at <= ?';

  if (environment) {
    timelineWhere += ' AND m.environment = ?';
    timelineFilters.push(environment);
  }

  const timelineQuery = `SELECT ${dateExpr} as date, m.status, COUNT(*) as count ${timelineWhere} GROUP BY date, m.status ORDER BY date ASC`;
  const timelineResult = await c.env.DB.prepare(timelineQuery)
    .bind(...timelineFilters)
    .all<{ date: string; status: string; count: number }>();

  // Build totals
  const totals = { sent: 0, failed: 0, captured: 0, received: 0 };
  for (const row of timelineResult.results) {
    if (row.status === 'sent') totals.sent += row.count;
    else if (row.status === 'failed') totals.failed += row.count;
    else if (row.status === 'captured') totals.captured += row.count;
    else if (row.status === 'received') totals.received += row.count;
  }

  // Build timeline
  const timelineMap = new Map<string, { date: string; sent: number; failed: number; captured: number; received: number }>();
  for (const row of timelineResult.results) {
    if (!timelineMap.has(row.date)) {
      timelineMap.set(row.date, { date: row.date, sent: 0, failed: 0, captured: 0, received: 0 });
    }
    const entry = timelineMap.get(row.date)!;
    if (row.status === 'sent') entry.sent += row.count;
    else if (row.status === 'failed') entry.failed += row.count;
    else if (row.status === 'captured') entry.captured += row.count;
    else if (row.status === 'received') entry.received += row.count;
  }
  const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // No byProject for API key (single project scope)
  const byProject: Array<{ projectId: string; projectName: string; sent: number; failed: number; captured: number; received: number }> = [];

  return c.json({
    data: {
      period: { from: fromDate.toISOString(), to: toDate.toISOString(), groupBy: queryGroupBy },
      totals,
      byProject,
      timeline,
    },
  });
});

export { statsRoutes };
