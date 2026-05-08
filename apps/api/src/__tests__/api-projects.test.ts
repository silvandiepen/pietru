import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiProjectsRoutes } from '../routes/api-projects';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { hashApiKey, generateAccountApiKey } from '@pietru/auth';

/**
 * Helper: make a request to the apiProjectsRoutes Hono app with mocked env.
 * We use vi.spyOn on the module to intercept the middleware and auth functions.
 */
async function makeRequest(opts: {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  env?: Partial<ReturnType<typeof createMockEnv>>;
  mockDb?: ReturnType<typeof createMockDb>;
}) {
  const mockDb = opts.mockDb ?? createMockDb();
  const fullEnv = createMockEnv({
    DB: mockDb as unknown as D1Database,
    KV: createMockKv() as unknown as KVNamespace,
    STORAGE: createMockR2() as unknown as R2Bucket,
    ...opts.env,
  });

  const headers = new Headers();
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

  // We can't easily pass env to Hono routes without the full app setup,
  // so we test the handler logic directly by importing and calling the handler.
  // Instead, we test at a higher level by examining the route's behavior.

  // For Hono, we use app.fetch with a minimal ExecutionContext-like object.
  // @ts-expect-error - Hono internal types
  const res = await apiProjectsRoutes.fetch(req, fullEnv, {} as ExecutionContext);
  return { res, mockDb, env: fullEnv };
}

describe('POST /api/projects (api-projects route)', () => {
  let accountKey: string;
  let accountKeyHash: string;

  beforeEach(async () => {
    const generated = await generateAccountApiKey();
    accountKey = generated.key;
    accountKeyHash = generated.hash;
    vi.restoreAllMocks();
  });

  it('creates a project successfully with valid account API key', async () => {
    const mockDb = createMockDb();

    // Mock the account API key lookup (the requireAccountApiKey middleware queries this)
    // The middleware calls: SELECT id, user_id, revoked_at FROM account_api_keys WHERE key_hash = ?
    // We need to make prepare().bind().first() return the right thing for the auth query first,
    // then for subsequent queries.

    let callCount = 0;
    const originalFirst = mockDb.first;
    mockDb.first = vi.fn(async () => {
      callCount++;
      // First call: account API key lookup
      if (callCount === 1) {
        return { id: 'aak_1', user_id: 'usr_1', revoked_at: null };
      }
      // Second call: ensureUniqueSlug
      if (callCount === 2) {
        return null; // slug is unique
      }
      // Third call: user settings
      if (callCount === 3) {
        return null; // no default resend key
      }
      return null;
    });

    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accountKey}`);
    headers.set('Content-Type', 'application/json');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test Project' }),
    });

    // @ts-expect-error - minimal execution context
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    if (res.status !== 201) {
      const errorBody = await res.json();
      console.log('DEBUG response:', res.status, JSON.stringify(errorBody));
      console.log('DEBUG prepare calls:', mockDb.prepare.mock.calls.length);
      console.log('DEBUG first calls:', mockDb.first.mock.calls.length);
    }
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe('Test Project');
    expect(body.data.slug).toBe('test-project');
    expect(body.data.projectApiKeys).toHaveLength(1);
    expect(body.data.projectApiKeys[0].key).toMatch(/^mg_pk_test_/);
    expect(body.data.projectApiKeys[0].environment).toBe('development');
  });

  it('creates a project with custom slug', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return { id: 'aak_1', user_id: 'usr_1', revoked_at: null };
      if (callCount === 2) return null; // unique slug
      if (callCount === 3) return null; // no user settings
      return null;
    });

    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accountKey}`);
    headers.set('Content-Type', 'application/json');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test', slug: 'my-custom-slug' }),
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.slug).toBe('my-custom-slug');
  });

  it('creates a project with production environment', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return { id: 'aak_1', user_id: 'usr_1', revoked_at: null };
      if (callCount === 2) return null;
      if (callCount === 3) return null;
      return null;
    });

    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accountKey}`);
    headers.set('Content-Type', 'application/json');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Prod Project', environment: 'production' }),
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.environment).toBe('production');
    expect(body.data.projectApiKeys[0].key).toMatch(/^mg_pk_live_/);
  });

  it('auto-provisions provider config when user has default Resend API key', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) return { id: 'aak_1', user_id: 'usr_1', revoked_at: null };
      if (callCount === 2) return null; // unique slug
      if (callCount === 3) {
        return {
          default_resend_api_key_encrypted: 'encrypted-key-data',
          default_from_address: 'noreply@example.com',
        };
      }
      return null;
    });

    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accountKey}`);
    headers.set('Content-Type', 'application/json');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Auto Provision' }),
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(201);

    // Verify that run() was called multiple times (project insert + provider config insert + api key insert)
    expect(mockDb.run.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('returns 401 without Authorization header', async () => {
    const mockDb = createMockDb();
    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid API key', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null); // key not found
    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', 'Bearer mg_ak_invalid_key_here_12345678');
    headers.set('Content-Type', 'application/json');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test' }),
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty name', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue({ id: 'aak_1', user_id: 'usr_1', revoked_at: null });
    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accountKey}`);
    headers.set('Content-Type', 'application/json');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '' }),
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue({ id: 'aak_1', user_id: 'usr_1', revoked_at: null });
    const env = createMockEnv({
      DB: mockDb as unknown as D1Database,
    });

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accountKey}`);
    headers.set('Content-Type', 'text/plain');

    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers,
      body: 'not json',
    });

    // @ts-expect-error
    const res = await apiProjectsRoutes.fetch(req, env, {} as ExecutionContext);
    expect(res.status).toBe(400);
  });
});
