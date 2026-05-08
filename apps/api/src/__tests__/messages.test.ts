import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageRoutes } from '../routes/messages';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { generateApiKey, hashApiKey } from '@pietru/auth';

const PROJECT_ID = 'proj_abc123';
const ENVIRONMENT = 'development';

/**
 * Helper to fetch against the messageRoutes Hono app.
 */
async function fetchMessageRoute(opts: {
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
  const res = await messageRoutes.fetch(req, env, {} as ExecutionContext);
  return { res, mockDb, mockKv, mockR2 };
}

/**
 * Sets up mock DB for project API key authentication.
 */
function setupProjectKeyAuth(mockDb: ReturnType<typeof createMockDb>) {
  let callCount = 0;
  mockDb.first = vi.fn(async () => {
    callCount++;
    // First call: project API key auth
    if (callCount === 1) {
      return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
    }
    return null;
  });
  return { callCount: 0 };
}

describe('POST /messages', () => {
  const projectKey = 'mg_pk_test_abcdefghijklmnopqrstuvwx';

  it('sends a message with html and subject (capture mode, no provider config)', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      // provider config lookup
      if (callCount === 2) {
        return null; // no provider config → capture mode
      }
      // final SELECT after insert
      if (callCount === 3) {
        return { id: 'msg_new', status: 'captured', to_address: 'user@example.com' };
      }
      return null;
    });

    const mockKv = createMockKv();
    const mockR2 = createMockR2();

    const { res, mockDb: db } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Test Subject',
        html: '<p>Hello World</p>',
      },
      mockDb,
      mockKv,
      mockR2,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toBeDefined();
    // In capture mode, html should be stored in R2
    expect(mockR2.put).toHaveBeenCalled();
    // Message event should be inserted
    expect(db.run.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('sends a message with templateId, resolving and rendering template', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      // template lookup
      if (callCount === 2) {
        return {
          id: 'tpl_1',
          subject: 'Welcome, {{name}}!',
          html: '<h1>Hello {{name}}</h1>',
          text: 'Hello {{name}}',
        };
      }
      // provider config lookup
      if (callCount === 3) {
        return null; // capture mode
      }
      // final SELECT
      if (callCount === 4) {
        return { id: 'msg_new', status: 'captured', subject: 'Welcome, Alice!' };
      }
      return null;
    });

    const mockKv = createMockKv();
    const mockR2 = createMockR2();

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_1',
        data: { name: 'Alice' },
      },
      mockDb,
      mockKv,
      mockR2,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('returns 404 when template is not found', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      return null; // template not found
    });

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_nonexistent',
        data: { name: 'Alice' },
      },
      mockDb,
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('not_found');
    expect(body.error.message).toMatch(/template/i);
  });

  it('returns 400 when template has neither html nor text', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      // template with no html and no text
      if (callCount === 2) {
        return { id: 'tpl_1', subject: 'Hi', html: null, text: null };
      }
      return null;
    });

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        templateId: 'tpl_1',
        data: {},
      },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toMatch(/html or text/i);
  });

  it('returns 400 for validation error (missing content and template)', async () => {
    const mockDb = createMockDb();
    setupProjectKeyAuth(mockDb);

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
      },
      mockDb,
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 without Authorization header', async () => {
    const mockDb = createMockDb();

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      },
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid API key', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null);

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: 'Bearer mg_pk_live_invalid' },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      },
      mockDb,
    });

    expect(res.status).toBe(401);
  });

  it('handles idempotency key for duplicate requests', async () => {
    const mockDb = createMockDb();
    const mockKv = createMockKv();
    const messageId = 'msg_existing';
    const idempotencyKey = 'idem-12345';

    // KV returns an existing message ID
    mockKv.get.mockResolvedValue(messageId);

    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      // The existing message lookup
      if (callCount === 2) {
        return { id: messageId, status: 'sent', to_address: 'user@example.com' };
      }
      return null;
    });

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: {
        Authorization: `Bearer ${projectKey}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: {
        to: 'user@example.com',
        from: 'admin@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      },
      mockDb,
      mockKv,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(messageId);
  });

  it('returns 400 when from domain is not in allowed domains', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      // provider config with allowed domains
      if (callCount === 2) {
        return {
          id: 'pcfg_1',
          provider_type: 'resend',
          config_encrypted: '{}',
          mode: 'capture',
          environment: 'production',
          default_from: 'noreply@example.com',
          allowed_domains_json: '["example.com"]',
        };
      }
      return null;
    });

    const { res } = await fetchMessageRoute({
      method: 'POST',
      path: '/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      body: {
        to: 'user@example.com',
        from: 'admin@otherdomain.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      },
      mockDb,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('invalid_from_domain');
  });
});

describe('GET /messages/:id', () => {
  const projectKey = 'mg_pk_test_abcdefghijklmnopqrstuvwx';

  it('returns a single message with events', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      // message lookup
      if (callCount === 2) {
        return { id: 'msg_1', to_address: 'user@example.com', status: 'sent' };
      }
      return null;
    });
    mockDb.all.mockResolvedValue({
      results: [
        { id: 'mevt_1', type: 'created', created_at: '2024-01-01T00:00:00Z' },
        { id: 'mevt_2', type: 'sent', created_at: '2024-01-01T00:00:01Z' },
      ],
    });

    const { res } = await fetchMessageRoute({
      method: 'GET',
      path: '/messages/msg_1',
      headers: { Authorization: `Bearer ${projectKey}` },
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
        return { id: 'pak_1', project_id: PROJECT_ID, environment: ENVIRONMENT, revoked_at: null };
      }
      return null; // message not found
    });

    const { res } = await fetchMessageRoute({
      method: 'GET',
      path: '/messages/msg_nonexistent',
      headers: { Authorization: `Bearer ${projectKey}` },
      mockDb,
    });

    expect(res.status).toBe(404);
  });
});

describe('GET /test-inboxes/:inbox/messages', () => {
  const projectKey = 'mg_pk_test_abcdefghijklmnopqrstuvwx';

  it('returns messages for a development inbox', async () => {
    const mockDb = createMockDb();
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: 'development', revoked_at: null };
      }
      // project lookup by id and slug
      if (callCount === 2) {
        return { id: PROJECT_ID };
      }
      return null;
    });
    mockDb.all.mockResolvedValue({
      results: [
        { id: 'msg_1', to_address: 'test@example.com', status: 'captured' },
      ],
    });

    const { res } = await fetchMessageRoute({
      method: 'GET',
      path: '/test-inboxes/my-app-development/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      mockDb,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('returns 400 for invalid inbox format (no dash)', async () => {
    const mockDb = createMockDb();
    setupProjectKeyAuth(mockDb);

    const { res } = await fetchMessageRoute({
      method: 'GET',
      path: '/test-inboxes/nodash/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      mockDb,
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for production environment (not allowed for test inboxes)', async () => {
    const mockDb = createMockDb();
    setupProjectKeyAuth(mockDb);

    const { res } = await fetchMessageRoute({
      method: 'GET',
      path: '/test-inboxes/my-app-production/messages',
      headers: { Authorization: `Bearer ${projectKey}` },
      mockDb,
    });

    expect(res.status).toBe(400);
  });
});
