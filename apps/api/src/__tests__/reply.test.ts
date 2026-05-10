import { describe, it, expect, vi } from 'vitest';
import { replyRoutes } from '../routes/reply';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { sign } from 'hono/jwt';

const PROJECT_ID = 'proj_abc123';
const ENVIRONMENT = 'development';
const PROVIDER_CONFIG_ID = 'pcfg_123';
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

async function fetchReplyRoute(opts: {
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
  const res = await replyRoutes.fetch(req, env, {} as ExecutionContext);
  return { res, mockDb, mockKv, mockR2 };
}

describe('POST /messages/:id/reply', () => {
  const projectKey = 'mg_pk_test_abcdefghijklmnopqrstuvwx';

  it('returns 401 without credentials', async () => {
    const mockDb = createMockDb();

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      body: { html: '<p>Reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid API key', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null);

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: 'Bearer mg_pk_live_invalid' },
      body: { html: '<p>Reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 for validation error (missing html and text)', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      return null;
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {},
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
  });

  it('returns 404 when original message not found (API key)', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      return null;
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_nonexistent/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: { html: '<p>Reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('not_found');
  });

  it('returns 400 when original message has no provider config', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', project_id: PROJECT_ID, environment: ENVIRONMENT, provider_config_id: null, from_address: 'sender@example.com', subject: 'Hello' };
      }
      return null;
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: { html: '<p>Reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('provider_not_configured');
    expect(body.error.message).toMatch(/no provider config/i);
  });

  it('returns 400 when provider config not found in DB', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', project_id: PROJECT_ID, environment: ENVIRONMENT, provider_config_id: PROVIDER_CONFIG_ID, from_address: 'sender@example.com', subject: 'Hello' };
      }
      return null;
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: { html: '<p>Reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('provider_not_configured');
    expect(body.error.message).toMatch(/Provider config not found/i);
  });

  it('creates reply with default subject and to from original message', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', project_id: PROJECT_ID, environment: ENVIRONMENT, provider_config_id: PROVIDER_CONFIG_ID, from_address: 'sender@example.com', subject: 'Welcome!' };
      }
      if (callCount === 3) {
        return {
          id: PROVIDER_CONFIG_ID,
          provider_type: 'resend',
          config_encrypted: 'encrypted-config',
          mode: 'send',
          environment: 'development',
          default_from: 'noreply@example.com',
          allowed_domains_json: '[]',
        };
      }
      if (callCount === 4) {
        return { id: 'msg_new', status: 'sent', subject: 'Re: Welcome!' };
      }
      return null;
    });

    vi.mock('@pietru/auth', async () => {
      const actual = await vi.importActual('@pietru/auth');
      return {
        ...actual,
        decrypt: vi.fn().mockResolvedValue(JSON.stringify({ apiKey: 're_test_key' })),
      };
    });

    vi.mock('@pietru/providers', async () => {
      const actual = await vi.importActual('@pietru/providers');
      return {
        ...actual,
        ResendProvider: vi.fn().mockImplementation(() => ({
          sendEmail: vi.fn().mockResolvedValue({ id: 'resend_msg_123', status: 'sent' }),
          validateConfig: vi.fn().mockResolvedValue(undefined),
        })),
      };
    });

    const { res, mockDb: db } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: { html: '<p>Thanks!</p>' },
      mockDb,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(db.run.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('uses provided to and subject instead of defaults', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', project_id: PROJECT_ID, environment: ENVIRONMENT, provider_config_id: PROVIDER_CONFIG_ID, from_address: 'sender@example.com', subject: 'Original Subject' };
      }
      if (callCount === 3) {
        return {
          id: PROVIDER_CONFIG_ID,
          provider_type: 'resend',
          config_encrypted: 'encrypted-config',
          mode: 'send',
          environment: 'development',
          default_from: 'noreply@example.com',
          allowed_domains_json: '[]',
        };
      }
      if (callCount === 4) {
        return { id: 'msg_new', status: 'sent', subject: 'Custom Subject' };
      }
      return null;
    });

    vi.mock('@pietru/auth', async () => {
      const actual = await vi.importActual('@pietru/auth');
      return {
        ...actual,
        decrypt: vi.fn().mockResolvedValue(JSON.stringify({ apiKey: 're_test_key' })),
      };
    });

    vi.mock('@pietru/providers', async () => {
      const actual = await vi.importActual('@pietru/providers');
      return {
        ...actual,
        ResendProvider: vi.fn().mockImplementation(() => ({
          sendEmail: vi.fn().mockResolvedValue({ id: 'resend_msg_456', status: 'sent' }),
          validateConfig: vi.fn().mockResolvedValue(undefined),
        })),
      };
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'custom@example.com',
        subject: 'Custom Subject',
        html: '<p>Custom reply</p>',
      },
      mockDb,
    });

    expect(res.status).toBe(201);
  });

  it('works with user session auth (account-level)', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: SESSION_ID, user_id: USER_ID, token_hash: TOKEN_HASH, expires_at: '2099-01-01T00:00:00Z', revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', project_id: PROJECT_ID, environment: ENVIRONMENT, provider_config_id: PROVIDER_CONFIG_ID, from_address: 'sender@example.com', subject: 'Hello' };
      }
      if (callCount === 3) {
        return {
          id: PROVIDER_CONFIG_ID,
          provider_type: 'resend',
          config_encrypted: 'encrypted-config',
          mode: 'send',
          environment: 'development',
          default_from: 'noreply@example.com',
          allowed_domains_json: '[]',
        };
      }
      if (callCount === 4) {
        return { id: 'msg_new', status: 'sent' };
      }
      return null;
    });

    vi.mock('@pietru/auth', async () => {
      const actual = await vi.importActual('@pietru/auth');
      return {
        ...actual,
        decrypt: vi.fn().mockResolvedValue(JSON.stringify({ apiKey: 're_test_key' })),
      };
    });

    vi.mock('@pietru/providers', async () => {
      const actual = await vi.importActual('@pietru/providers');
      return {
        ...actual,
        ResendProvider: vi.fn().mockImplementation(() => ({
          sendEmail: vi.fn().mockResolvedValue({ id: 'resend_msg_789', status: 'sent' }),
          validateConfig: vi.fn().mockResolvedValue(undefined),
        })),
      };
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Cookie: await createSessionCookie() },
      body: { html: '<p>Session reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(201);
  });

  it('returns 400 when original message has no from_address and no to provided', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      if (callCount === 2) {
        return { id: 'msg_1', project_id: PROJECT_ID, environment: ENVIRONMENT, provider_config_id: PROVIDER_CONFIG_ID, from_address: null, subject: 'Hello' };
      }
      if (callCount === 3) {
        return {
          id: PROVIDER_CONFIG_ID,
          provider_type: 'resend',
          config_encrypted: 'encrypted-config',
          mode: 'send',
          environment: 'development',
          default_from: 'noreply@example.com',
          allowed_domains_json: '[]',
        };
      }
      return null;
    });

    const { res } = await fetchReplyRoute({
      method: 'POST',
      path: '/messages/msg_1/reply',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: { html: '<p>Reply</p>' },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
    expect(body.error.message).toMatch(/reply recipient/i);
  });
});
