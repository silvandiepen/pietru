import { describe, it, expect, vi } from 'vitest';
import { statsRoutes } from '../routes/stats';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { sign } from 'hono/jwt';

const PROJECT_ID = 'proj_abc123';
const ENVIRONMENT = 'development';
const USER_ID = 'user_1';
const SESSION_ID = 'sess_1';
const TOKEN_HASH = 'hashed-token-value';
const JWT_SECRET = 'test-jwt-secret-for-testing';

async function createSessionCookie(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = await sign(
    { sub: USER_ID, sid: SESSION_ID, sth: TOKEN_HASH, exp },
    JWT_SECRET,
    'HS256',
  );
  return `session=${jwt}`;
}

async function fetchStatsRoute(opts: {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  mockDb?: ReturnType<typeof createMockDb>;
  mockKv?: ReturnType<typeof createMockKv>;
  mockR2?: ReturnType<typeof createMockR2>;
}) {
  const mockDb = opts.mockDb ?? createMockDb();
  const mockKv = opts.mockKv ?? createMockKv();
  const mockR2 = opts.mockR2 ?? createMockR2();
  const env = createMockEnv({
    DB: mockDb as unknown as D1Database,
    KV: mockKv as unknown as KVNamespace,
    STORAGE: mockR2 as unknown as R2Bucket,
    JWT_SECRET,
  });

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      headers.set(k, v);
    }
  }

  const req = new Request(`http://localhost${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  // @ts-expect-error
  const res = await statsRoutes.fetch(req, env, {} as ExecutionContext);
  return { res, mockDb, mockKv, mockR2 };
}

describe('GET /stats', () => {
  const projectKey = 'mg_pk_test_abcdefghijklmnopqrstuvwx';

  it('returns 401 without credentials', async () => {
    const mockDb = createMockDb();

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats',
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid API key', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null);

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats',
      headers: { Authorization: 'Bearer mg_pk_live_invalid' },
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('returns stats for user session auth with default date range', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    mockDb.all = vi.fn(async () => ({
      results: [
        { date: '2025-04-01', status: 'sent', count: 10 },
        { date: '2025-04-01', status: 'captured', count: 5 },
        { date: '2025-04-02', status: 'sent', count: 8 },
        { date: '2025-04-02', status: 'failed', count: 2 },
      ],
    }));

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.period).toBeDefined();
    expect(body.data.period.groupBy).toBe('day');
    expect(body.data.totals).toEqual({ sent: 18, failed: 2, captured: 5, received: 0 });
    expect(body.data.timeline).toHaveLength(2);
    expect(body.data.timeline[0].date).toBe('2025-04-01');
    expect(body.data.timeline[0].sent).toBe(10);
  });

  it('returns stats grouped by month', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    mockDb.all = vi.fn(async () => ({
      results: [
        { date: '2025-04', status: 'sent', count: 50 },
        { date: '2025-05', status: 'sent', count: 30 },
      ],
    }));

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats?groupBy=month',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.period.groupBy).toBe('month');
    expect(body.data.timeline).toHaveLength(2);
  });

  it('returns 400 for invalid groupBy value', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats?groupBy=week',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
  });

  it('filters by project and returns 404 for unowned project', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats?project=proj_unowned',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('not_found');
  });

  it('filters by project for owned project', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      if (callCount === 2) {
        return { id: PROJECT_ID };
      }
      return null;
    });

    mockDb.all = vi.fn(async () => ({
      results: [
        { date: '2025-05-01', status: 'sent', count: 4 },
      ],
    }));

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: `/stats?project=${PROJECT_ID}`,
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totals.sent).toBe(4);
  });

  it('includes byProject breakdown when no project filter (user session)', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    let allCallCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    mockDb.all = vi.fn(async () => {
      allCallCount++;
      if (allCallCount === 1) {
        return {
          results: [
            { date: '2025-05-01', status: 'sent', count: 5 },
          ],
        };
      }
      if (allCallCount === 2) {
        return {
          results: [
            { projectId: 'proj_a', projectName: 'Project A', status: 'sent', count: 3 },
            { projectId: 'proj_a', projectName: 'Project A', status: 'captured', count: 2 },
            { projectId: 'proj_b', projectName: 'Project B', status: 'sent', count: 2 },
          ],
        };
      }
      return { results: [] };
    });

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.byProject).toHaveLength(2);
    expect(body.data.byProject[0].projectName).toBe('Project A');
    expect(body.data.byProject[0].sent).toBe(3);
    expect(body.data.byProject[0].captured).toBe(2);
  });

  it('returns stats for API key auth (project-scoped)', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      return null;
    });

    mockDb.all = vi.fn(async () => ({
      results: [
        { date: '2025-05-01', status: 'sent', count: 10 },
        { date: '2025-05-01', status: 'failed', count: 1 },
      ],
    }));

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats',
      headers: { Authorization: `Bearer ${projectKey}` },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totals).toEqual({ sent: 10, failed: 1, captured: 0, received: 0 });
    expect(body.data.byProject).toHaveLength(0);
  });

  it('returns 400 for invalid date format', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    const { res } = await fetchStatsRoute({
      method: 'GET',
      path: '/stats?from=not-a-date',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
  });
});
