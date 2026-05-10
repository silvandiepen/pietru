import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseInboundAddress } from '@pietru/core';
import { emailHookRoutes } from '../routes/email-hooks';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { sign } from 'hono/jwt';

const PROJECT_ID = 'proj_abc123';
const USER_ID = 'user_abc123';
const SESSION_ID = 'sess_abc123';
const TOKEN_HASH = 'hashed-token-value';
const JWT_SECRET = 'test-jwt-secret-for-testing';

/**
 * Create a signed session JWT cookie string for testing.
 */
async function createSessionCookie(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const jwt = await sign(
    { sub: USER_ID, sid: SESSION_ID, sth: TOKEN_HASH, exp },
    JWT_SECRET,
    'HS256',
  );
  return `session=${jwt}`;
}

/**
 * Helper to fetch against the emailHookRoutes Hono app.
 */
async function fetchHookRoute(opts: {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  mockDb?: ReturnType<typeof createMockDb>;
  mockKv?: ReturnType<typeof createMockKv>;
  mockR2?: ReturnType<typeof createMockR2>;
  /** If false, omit the session cookie (default: true) */
  withSession?: boolean;
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
  if (opts.withSession !== false) {
    headers.set('Cookie', await createSessionCookie());
  }
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

  // @ts-expect-error — Hono route testing pattern
  const res = await emailHookRoutes.fetch(req, env, {} as ExecutionContext);
  return { res, mockDb, mockKv, mockR2 };
}

/**
 * Sets up mock DB for session authentication + project ownership check.
 * The requireUserSession middleware will:
 *   1st call: verify session in user_sessions table
 *   2nd call (for auth'd routes): verify project ownership
 */
function setupAuthAndOwnership(mockDb: ReturnType<typeof createMockDb>) {
  let callCount = 0;
  mockDb.first = vi.fn(async () => {
    callCount++;
    // First call: session lookup from requireUserSession middleware
    if (callCount === 1) {
      return {
        id: SESSION_ID,
        user_id: USER_ID,
        token_hash: TOKEN_HASH,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        revoked_at: null,
      };
    }
    // Second call: project ownership check
    if (callCount === 2) {
      return { id: PROJECT_ID };
    }
    return null;
  });
  return { callCount: 0 };
}

// ---------------------------------------------------------------------------
// parseInboundAddress tests (with tags)
// ---------------------------------------------------------------------------
describe('parseInboundAddress', () => {
  it('parses address with tag', () => {
    const result = parseInboundAddress('myproject/sil+support@pietru.dev', 'pietru.dev');
    expect(result).toEqual({
      projectSlug: 'myproject',
      userSlug: 'sil',
      tag: 'support',
    });
  });

  it('parses address without tag', () => {
    const result = parseInboundAddress('myproject/sil@pietru.dev', 'pietru.dev');
    expect(result).toEqual({
      projectSlug: 'myproject',
      userSlug: 'sil',
      tag: null,
    });
  });

  it('returns null for wrong domain', () => {
    const result = parseInboundAddress('myproject/sil+tag@other.dev', 'pietru.dev');
    expect(result).toBeNull();
  });

  it('returns null for missing slash', () => {
    const result = parseInboundAddress('myproject@pietru.dev', 'pietru.dev');
    expect(result).toBeNull();
  });

  it('parses complex tag values', () => {
    const result = parseInboundAddress('myproject/sil+urgent-support@pietru.dev', 'pietru.dev');
    expect(result).toEqual({
      projectSlug: 'myproject',
      userSlug: 'sil',
      tag: 'urgent-support',
    });
  });

  it('is case-insensitive', () => {
    const result = parseInboundAddress('MyProject/Sil+Support@Pietru.Dev', 'pietru.dev');
    expect(result).toEqual({
      projectSlug: 'myproject',
      userSlug: 'sil',
      tag: 'support',
    });
  });
});

// ---------------------------------------------------------------------------
// Hook matching logic tests
// ---------------------------------------------------------------------------
describe('hook matching logic', () => {
  type Hook = {
    filter_type: string;
    filter_value: string | null;
  };

  function matchesHook(
    hook: Hook,
    opts: { tag?: string | null; fromAddress: string; subject: string },
  ): boolean {
    const { tag, fromAddress, subject } = opts;
    const fromDomain = fromAddress.split('@')[1] ?? '';

    switch (hook.filter_type) {
      case 'tag':
        return hook.filter_value != null && hook.filter_value === tag;
      case 'from_domain':
        return hook.filter_value != null && hook.filter_value === fromDomain;
      case 'subject_regex': {
        if (!hook.filter_value) return false;
        try {
          return new RegExp(hook.filter_value, 'i').test(subject);
        } catch {
          return false;
        }
      }
      case 'any':
        return true;
      default:
        return false;
    }
  }

  it('tag filter matches when tag matches', () => {
    const hook: Hook = { filter_type: 'tag', filter_value: 'support' };
    expect(matchesHook(hook, { tag: 'support', fromAddress: 'user@example.com', subject: 'Help' })).toBe(true);
  });

  it('tag filter does not match when tag is different', () => {
    const hook: Hook = { filter_type: 'tag', filter_value: 'support' };
    expect(matchesHook(hook, { tag: 'billing', fromAddress: 'user@example.com', subject: 'Help' })).toBe(false);
  });

  it('tag filter does not match when tag is null', () => {
    const hook: Hook = { filter_type: 'tag', filter_value: 'support' };
    expect(matchesHook(hook, { tag: null, fromAddress: 'user@example.com', subject: 'Help' })).toBe(false);
  });

  it('from_domain filter matches domain', () => {
    const hook: Hook = { filter_type: 'from_domain', filter_value: 'example.com' };
    expect(matchesHook(hook, { fromAddress: 'user@example.com', subject: 'Hi' })).toBe(true);
  });

  it('from_domain filter does not match different domain', () => {
    const hook: Hook = { filter_type: 'from_domain', filter_value: 'example.com' };
    expect(matchesHook(hook, { fromAddress: 'user@other.com', subject: 'Hi' })).toBe(false);
  });

  it('subject_regex filter matches regex', () => {
    const hook: Hook = { filter_type: 'subject_regex', filter_value: 'urgent' };
    expect(matchesHook(hook, { fromAddress: 'user@example.com', subject: 'URGENT: help needed' })).toBe(true);
  });

  it('subject_regex filter does not match when regex fails', () => {
    const hook: Hook = { filter_type: 'subject_regex', filter_value: 'urgent' };
    expect(matchesHook(hook, { fromAddress: 'user@example.com', subject: 'Just a question' })).toBe(false);
  });

  it('any filter always matches', () => {
    const hook: Hook = { filter_type: 'any', filter_value: null };
    expect(matchesHook(hook, { fromAddress: 'user@example.com', subject: 'anything' })).toBe(true);
  });

  it('subject_regex with invalid regex does not crash', () => {
    const hook: Hook = { filter_type: 'subject_regex', filter_value: '[invalid' };
    expect(matchesHook(hook, { fromAddress: 'user@example.com', subject: 'test' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// API CRUD tests
// ---------------------------------------------------------------------------
describe('POST /projects/:id/email-hooks — create', () => {
  it('creates a hook with valid data', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);
    mockDb.run.mockResolvedValue({ meta: { changes: 1 } });

    const { res } = await fetchHookRoute({
      method: 'POST',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      body: {
        name: 'Support Hook',
        filter_type: 'tag',
        filter_value: 'support',
        webhook_url: 'https://example.com/webhook',
      },
      mockDb,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.name).toBe('Support Hook');
    expect(body.data.filter_type).toBe('tag');
    expect(body.data.filter_value).toBe('support');
    expect(body.data.webhook_url).toBe('https://example.com/webhook');
    expect(body.data.is_active).toBe(true);
  });

  it('creates a hook with webhook_secret and custom headers', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);

    const { res } = await fetchHookRoute({
      method: 'POST',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      body: {
        name: 'Secret Hook',
        filter_type: 'any',
        webhook_url: 'https://example.com/hook',
        webhook_secret: 'my-secret',
        webhook_headers_json: '{"X-Custom": "value"}',
      },
      mockDb,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.webhook_secret).toBe('my-secret');
    expect(body.data.webhook_headers_json).toBe('{"X-Custom": "value"}');
  });

  it('returns 400 for invalid filter_type', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);

    const { res } = await fetchHookRoute({
      method: 'POST',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      body: {
        name: 'Bad Hook',
        filter_type: 'invalid_type',
        webhook_url: 'https://example.com/hook',
      },
      mockDb,
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid webhook_url', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);

    const { res } = await fetchHookRoute({
      method: 'POST',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      body: {
        name: 'Bad Hook',
        filter_type: 'any',
        webhook_url: 'not-a-url',
      },
      mockDb,
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 without session cookie', async () => {
    const mockDb = createMockDb();

    const { res } = await fetchHookRoute({
      method: 'POST',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      body: {
        name: 'Hook',
        filter_type: 'any',
        webhook_url: 'https://example.com/hook',
      },
      mockDb,
      withSession: false,
    });

    expect(res.status).toBe(401);
  });

  it('returns 404 when project not found', async () => {
    const mockDb = createMockDb();
    // Session auth succeeds but project ownership fails
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          id: SESSION_ID,
          user_id: USER_ID,
          token_hash: TOKEN_HASH,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          revoked_at: null,
        };
      }
      return null; // project not found
    });

    const { res } = await fetchHookRoute({
      method: 'POST',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      body: {
        name: 'Hook',
        filter_type: 'any',
        webhook_url: 'https://example.com/hook',
      },
      mockDb,
    });

    expect(res.status).toBe(404);
  });
});

describe('GET /projects/:id/email-hooks — list', () => {
  it('returns hooks for a project', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);
    mockDb.all.mockResolvedValue({
      results: [
        { id: 'hook_1', project_id: PROJECT_ID, name: 'Hook 1', is_active: 1, filter_type: 'tag', filter_value: 'support', webhook_url: 'https://example.com/hook', webhook_secret: null, webhook_headers_json: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 'hook_2', project_id: PROJECT_ID, name: 'Hook 2', is_active: 0, filter_type: 'any', filter_value: null, webhook_url: 'https://example.com/hook2', webhook_secret: null, webhook_headers_json: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ],
    });

    const { res } = await fetchHookRoute({
      method: 'GET',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].is_active).toBe(true);
    expect(body.data[1].is_active).toBe(false);
  });

  it('returns 404 when project not found', async () => {
    const mockDb = createMockDb();
    // Session auth succeeds but project ownership fails
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          id: SESSION_ID,
          user_id: USER_ID,
          token_hash: TOKEN_HASH,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          revoked_at: null,
        };
      }
      return null;
    });

    const { res } = await fetchHookRoute({
      method: 'GET',
      path: `/projects/${PROJECT_ID}/email-hooks`,
      mockDb,
    });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /projects/:id/email-hooks/:hookId — update', () => {
  it('updates a hook name', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          id: SESSION_ID,
          user_id: USER_ID,
          token_hash: TOKEN_HASH,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          revoked_at: null,
        };
      }
      if (callCount === 2) return { id: PROJECT_ID }; // ownership
      if (callCount === 3) {
        return { id: 'hook_1', name: 'Updated Hook', is_active: 1, filter_type: 'tag', filter_value: 'support', webhook_url: 'https://example.com/hook' }; // updated hook
      }
      return null;
    });

    const { res } = await fetchHookRoute({
      method: 'PATCH',
      path: `/projects/${PROJECT_ID}/email-hooks/hook_1`,
      body: { name: 'Updated Hook' },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Updated Hook');
  });

  it('returns 404 when hook not found after update', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          id: SESSION_ID,
          user_id: USER_ID,
          token_hash: TOKEN_HASH,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          revoked_at: null,
        };
      }
      if (callCount === 2) return { id: PROJECT_ID }; // ownership
      return null; // hook not found after update
    });

    const { res } = await fetchHookRoute({
      method: 'PATCH',
      path: `/projects/${PROJECT_ID}/email-hooks/hook_nonexistent`,
      body: { name: 'Updated' },
      mockDb,
    });

    expect(res.status).toBe(404);
  });

  it('returns 400 for no fields to update', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);

    const { res } = await fetchHookRoute({
      method: 'PATCH',
      path: `/projects/${PROJECT_ID}/email-hooks/hook_1`,
      body: {},
      mockDb,
    });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /projects/:id/email-hooks/:hookId — delete', () => {
  it('deletes a hook', async () => {
    const mockDb = createMockDb();
    setupAuthAndOwnership(mockDb);

    const { res } = await fetchHookRoute({
      method: 'DELETE',
      path: `/projects/${PROJECT_ID}/email-hooks/hook_1`,
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.ok).toBe(true);
    expect(mockDb.run).toHaveBeenCalled();
  });

  it('returns 404 when project not found', async () => {
    const mockDb = createMockDb();
    // Session auth succeeds but project ownership fails
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          id: SESSION_ID,
          user_id: USER_ID,
          token_hash: TOKEN_HASH,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          revoked_at: null,
        };
      }
      return null;
    });

    const { res } = await fetchHookRoute({
      method: 'DELETE',
      path: `/projects/${PROJECT_ID}/email-hooks/hook_1`,
      mockDb,
    });

    expect(res.status).toBe(404);
  });
});
