import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templateRoutes } from '../routes/templates';
import { createMockDb, createMockEnv, createMockKv, createMockR2 } from './helpers';
import { generateApiKey, hashApiKey } from '@pietru/auth';

/**
 * Creates a Hono fetch request with mocked Cloudflare env.
 * The templates route handles its own auth via `authenticateAccess`,
 * so we set up mock DB to return valid auth results.
 */
async function fetchTemplateRoute(opts: {
  method: string;
  path: string;
  body?: unknown;
  auth?: 'project' | 'user';
  projectId?: string;
  mockDb?: ReturnType<typeof createMockDb>;
}) {
  const mockDb = opts.mockDb ?? createMockDb();
  const env = createMockEnv({
    DB: mockDb as unknown as D1Database,
    KV: createMockKv() as unknown as KVNamespace,
    STORAGE: createMockR2() as unknown as R2Bucket,
  });

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  if (opts.auth === 'project') {
    const key = 'mg_pk_live_abcdefghijklmnopqrstuvwx';
    headers.set('Authorization', `Bearer ${key}`);
  } else if (opts.auth === 'user') {
    // Session auth uses cookies, but our authenticateAccess also tries Bearer first.
    // For project API key auth tests, use the Bearer header path.
    // For user session, we'd need a JWT cookie, which is harder to mock.
    // We test the project API key path since it's more common for API usage.
    const key = 'mg_ak_abcdefghijklmnopqrstuvwx12';
    headers.set('Authorization', `Bearer ${key}`);
  }

  const req = new Request(`http://localhost${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  // @ts-expect-error
  const res = await templateRoutes.fetch(req, env, {} as ExecutionContext);
  return { res, mockDb };
}

describe('Templates CRUD', () => {
  const PROJECT_ID = 'proj_abc123';
  const TEMPLATE_ID = 'tpl_xyz789';

  function setupProjectAuth(mockDb: ReturnType<typeof createMockDb>, projectId: string) {
    // authenticateProjectApiKey: SELECT ... FROM project_api_keys WHERE key_hash = ?
    // verifyProjectOwnership (for account key): SELECT id FROM projects WHERE id = ? AND user_id = ?
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      // First call is the API key auth lookup
      if (callCount === 1) {
        return { id: 'pak_1', project_id: projectId, environment: 'production', revoked_at: null };
      }
      return null;
    });
    return callCount;
  }

  function setupAccountAuth(mockDb: ReturnType<typeof createMockDb>, userId: string, projectId: string) {
    let callCount = 0;
    mockDb.first = vi.fn(async () => {
      callCount++;
      // First call: account API key lookup
      if (callCount === 1) {
        return { id: 'aak_1', user_id: userId, revoked_at: null };
      }
      // Second call: verify project ownership
      if (callCount === 2) {
        return { id: projectId };
      }
      return null;
    });
    return callCount;
  }

  describe('POST /projects/:projectId/templates — create template', () => {
    it('creates a template with project API key auth', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        // Second call: the SELECT * FROM email_templates WHERE id = ? after insert
        if (callCount === 2) {
          return { id: 'tpl_new', name: 'Welcome', subject: 'Welcome {{name}}', html: '<p>Hello</p>', text: 'Hello' };
        }
        return null;
      });

      const { res } = await fetchTemplateRoute({
        method: 'POST',
        path: `/projects/${PROJECT_ID}/templates`,
        auth: 'project',
        mockDb,
        body: { name: 'Welcome', subject: 'Welcome {{name}}', html: '<p>Hello {{name}}</p>' },
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toBeDefined();
    });

    it('rejects when project API key does not match project', async () => {
      const mockDb = createMockDb();
      mockDb.first = vi.fn(async () => {
        return { id: 'pak_1', project_id: 'proj_other', environment: 'production', revoked_at: null };
      });

      const { res } = await fetchTemplateRoute({
        method: 'POST',
        path: `/projects/${PROJECT_ID}/templates`,
        auth: 'project',
        mockDb,
        body: { name: 'Welcome', subject: 'Hi', html: '<p>Hi</p>' },
      });

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid payload', async () => {
      const mockDb = createMockDb();
      mockDb.first = vi.fn(async () => {
        return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
      });

      const { res } = await fetchTemplateRoute({
        method: 'POST',
        path: `/projects/${PROJECT_ID}/templates`,
        auth: 'project',
        mockDb,
        body: { name: '', subject: '' }, // empty name and subject
      });

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const mockDb = createMockDb();
      const env = createMockEnv({ DB: mockDb as unknown as D1Database });

      const req = new Request(`http://localhost/projects/${PROJECT_ID}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', subject: 'Hi', html: '<p>Hi</p>' }),
      });

      // @ts-expect-error
      const res = await templateRoutes.fetch(req, env, {} as ExecutionContext);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /projects/:projectId/templates — list templates', () => {
    it('lists templates for a project', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        return null;
      });
      mockDb.all.mockResolvedValue({
        results: [
          { id: 'tpl_1', name: 'Welcome', subject: 'Hi' },
          { id: 'tpl_2', name: 'Reset', subject: 'Reset' },
        ],
      });

      const { res } = await fetchTemplateRoute({
        method: 'GET',
        path: `/projects/${PROJECT_ID}/templates`,
        auth: 'project',
        mockDb,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('Welcome');
    });

    it('returns empty array when no templates exist', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        return null;
      });
      mockDb.all.mockResolvedValue({ results: [] });

      const { res } = await fetchTemplateRoute({
        method: 'GET',
        path: `/projects/${PROJECT_ID}/templates`,
        auth: 'project',
        mockDb,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(0);
    });
  });

  describe('GET /projects/:projectId/templates/:templateId — get single template', () => {
    it('returns a template by ID', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        if (callCount === 2) {
          return { id: TEMPLATE_ID, name: 'Welcome', subject: 'Hi', html: '<p>Hi</p>' };
        }
        return null;
      });

      const { res } = await fetchTemplateRoute({
        method: 'GET',
        path: `/projects/${PROJECT_ID}/templates/${TEMPLATE_ID}`,
        auth: 'project',
        mockDb,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(TEMPLATE_ID);
    });

    it('returns 404 when template does not exist', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        return null; // template not found
      });

      const { res } = await fetchTemplateRoute({
        method: 'GET',
        path: `/projects/${PROJECT_ID}/templates/tpl_nonexistent`,
        auth: 'project',
        mockDb,
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /projects/:projectId/templates/:templateId — update template', () => {
    it('updates template name', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        if (callCount === 2) {
          return { id: TEMPLATE_ID, name: 'Old Name', subject: 'Hi', html: '<p>Hi</p>' };
        }
        if (callCount === 3) {
          return { id: TEMPLATE_ID, name: 'New Name', subject: 'Hi', html: '<p>Hi</p>' };
        }
        return null;
      });

      const { res } = await fetchTemplateRoute({
        method: 'PATCH',
        path: `/projects/${PROJECT_ID}/templates/${TEMPLATE_ID}`,
        auth: 'project',
        mockDb,
        body: { name: 'New Name' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('New Name');
    });

    it('returns 404 when template does not exist', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        return null;
      });

      const { res } = await fetchTemplateRoute({
        method: 'PATCH',
        path: `/projects/${PROJECT_ID}/templates/tpl_nonexistent`,
        auth: 'project',
        mockDb,
        body: { name: 'New Name' },
      });

      expect(res.status).toBe(404);
    });

    it('returns existing template when no fields are provided to update', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        if (callCount === 2) {
          return { id: TEMPLATE_ID, name: 'Existing', subject: 'Hi' };
        }
        return null;
      });

      const { res } = await fetchTemplateRoute({
        method: 'PATCH',
        path: `/projects/${PROJECT_ID}/templates/${TEMPLATE_ID}`,
        auth: 'project',
        mockDb,
        body: {}, // no fields to update
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Existing');
    });
  });

  describe('DELETE /projects/:projectId/templates/:templateId — delete template', () => {
    it('deletes a template', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        if (callCount === 2) {
          return { id: TEMPLATE_ID, name: 'Delete Me' };
        }
        return null;
      });

      const { res, mockDb: db } = await fetchTemplateRoute({
        method: 'DELETE',
        path: `/projects/${PROJECT_ID}/templates/${TEMPLATE_ID}`,
        auth: 'project',
        mockDb,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.deleted).toBe(true);
    });

    it('returns 404 when template does not exist', async () => {
      const mockDb = createMockDb();
      let callCount = 0;
      mockDb.first = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { id: 'pak_1', project_id: PROJECT_ID, environment: 'production', revoked_at: null };
        }
        return null;
      });

      const { res } = await fetchTemplateRoute({
        method: 'DELETE',
        path: `/projects/${PROJECT_ID}/templates/tpl_nonexistent`,
        auth: 'project',
        mockDb,
      });

      expect(res.status).toBe(404);
    });
  });
});
