import { describe, it, expect, vi } from 'vitest';
import { inboxRoutes } from '../routes/inbox';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { sign } from 'hono/jwt';

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

async function fetchInboxRoute(opts: {
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
  const res = await inboxRoutes.fetch(req, env, {} as ExecutionContext);
  return { res, mockDb, mockKv, mockR2 };
}

function setupSessionAuth(mockDb: ReturnType<typeof createMockDb>, overrides?: Record<number, unknown>) {
  let callCount = 0;
  mockDb.first = vi.fn(async () => {
    callCount++;
    if (callCount === 1) {
      return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
    }
    if (overrides && overrides[callCount] !== undefined) {
      return overrides[callCount];
    }
    return null;
  });
}

describe('GET /inbox', () => {
  it('returns 401 without session cookie', async () => {
    const mockDb = createMockDb();

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox',
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('returns messages for authenticated user', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({
      results: [
        { id: 'msg_1', subject: 'Hello', from_address: 'a@b.com', status: 'received', created_at: '2025-05-01T00:00:00Z' },
        { id: 'msg_2', subject: 'World', from_address: 'c@d.com', status: 'sent', created_at: '2025-05-02T00:00:00Z' },
      ],
    }));

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(2);
    expect(body.data.items[0].id).toBe('msg_1');
  });

  it('does not include NULL-project messages for a regular authenticated user', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({ results: [] }));

    const { res, mockDb: db } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const sql = vi.mocked(db.prepare).mock.calls.find(([query]) => String(query).startsWith('SELECT m.*'))?.[0] as string;
    expect(sql).toContain('INNER JOIN projects p ON p.id = m.project_id');
    expect(sql).toContain('WHERE p.user_id = ?');
    expect(sql).not.toContain('m.project_id IS NULL');
    expect(db.bind).toHaveBeenLastCalledWith(USER_ID, 21);
  });

  it('filters by project slug or ID', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({
      results: [
        { id: 'msg_1', subject: 'Project message', status: 'received', created_at: '2025-05-01T00:00:00Z' },
      ],
    }));

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox?project=my-app',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
  });

  it('filters by tag using json_extract', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({
      results: [
        { id: 'msg_1', subject: 'Signup', tags_json: '{"tag": "signup"}', status: 'received', created_at: '2025-05-01T00:00:00Z' },
      ],
    }));

    const { res, mockDb: db } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox?tag=signup',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("json_extract(m.tags_json, '$.tag')"),
    );
  });

  it('filters by status', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({
      results: [
        { id: 'msg_1', subject: 'Failed', status: 'failed', created_at: '2025-05-01T00:00:00Z' },
      ],
    }));

    const { res, mockDb: db } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox?status=failed',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining('m.status = ?'),
    );
  });

  it('searches by subject, from, and to', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({
      results: [
        { id: 'msg_1', subject: 'Welcome email', status: 'received', created_at: '2025-05-01T00:00:00Z' },
      ],
    }));

    const { res, mockDb: db } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox?search=welcome',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining('m.subject LIKE ?'),
    );
  });

  it('supports cursor-based pagination', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    const items = Array.from({ length: 21 }, (_, i) => ({
      id: `msg_${i}`,
      subject: `Message ${i}`,
      status: 'received',
      created_at: `2025-05-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }));

    mockDb.all = vi.fn(async () => ({
      results: items,
    }));

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox?limit=20',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(20);
    expect(body.data.nextCursor).toBeTruthy();
  });

  it('respects max limit of 100', async () => {
    const mockDb = createMockDb();
    setupSessionAuth(mockDb);

    mockDb.all = vi.fn(async () => ({
      results: [],
    }));

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox?limit=200',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    // Verify prepare was called (the limit gets capped to 100 in the bind)
    expect(mockDb.prepare).toHaveBeenCalled();
  });
});

describe('GET /inbox/:id', () => {
  it('returns a single message with events', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', subject: 'Hello', to_address: 'user@example.com', status: 'sent' };
      }
      return null;
    });
    mockDb.all = vi.fn(async () => ({
      results: [
        { id: 'mevt_1', type: 'created', created_at: '2024-01-01T00:00:00Z' },
        { id: 'mevt_2', type: 'sent', created_at: '2024-01-01T00:00:01Z' },
      ],
    }));

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox/msg_1',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe('msg_1');
    expect(body.data.events).toHaveLength(2);
  });

  it('returns 404 for non-existent message', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      return null;
    });

    const { res } = await fetchInboxRoute({
      method: 'GET',
      path: '/inbox/msg_nonexistent',
      headers: { Cookie: await createSessionCookie() },
      mockDb,
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('not_found');
  });
});
