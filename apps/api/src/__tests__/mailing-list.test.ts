import { sendSystemEmail } from '@pietru/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mailingListRoutes } from '../routes/mailing-list';
import { createMockDb, createMockEnv } from './helpers';

vi.mock('@pietru/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pietru/core')>();
  return {
    ...actual,
    sendSystemEmail: vi.fn().mockResolvedValue({ id: 'email_123' }),
  };
});

const PROJECT_ID = 'proj_abc123';
const LIST_ID = 'ml_abc123';
const PROJECT_KEY = 'mg_pk_test_abcdefghijklmnopqrstuvwx';

const mailingListRow = {
  id: LIST_ID,
  project_id: PROJECT_ID,
  name: 'Pietru Updates',
  slug: 'pietru-updates',
  description: null,
  meta: null,
  confirmation_email_from: null,
  confirmation_email_subject: null,
  confirmation_success_url: null,
  created_at: '2026-05-18T00:00:00.000Z',
  updated_at: null,
  deleted_at: null,
};

async function fetchMailingListRoute(opts: {
  body: unknown;
  mockDb?: ReturnType<typeof createMockDb>;
  headers?: Record<string, string>;
}) {
  const mockDb = opts.mockDb ?? createMockDb();
  const headers = new Headers({
    'Content-Type': 'application/json',
    'User-Agent': 'vitest',
    Authorization: `Bearer ${PROJECT_KEY}`,
    ...opts.headers,
  });

  const req = new Request(`http://localhost/mailing-lists/${LIST_ID}/subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body),
  });

  const env = createMockEnv({ DB: mockDb as never });
  return {
    res: await mailingListRoutes.fetch(req, env, {} as never),
    mockDb,
  };
}

function setupSubscribeDb(mockDb: ReturnType<typeof createMockDb>, existingSubscriber: unknown = null) {
  let callCount = 0;
  mockDb.first = vi.fn(async () => {
    callCount += 1;

    if (callCount === 1) {
      return { id: 'pak_1', project_id: PROJECT_ID, environment: 'development', revoked_at: null };
    }

    if (callCount === 2) {
      return mailingListRow;
    }

    if (callCount === 3) {
      return existingSubscriber;
    }

    return null;
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /mailing-lists/:listId/subscribers', () => {
  it('creates a pending subscriber and sends a confirmation email through the system email API', async () => {
    const mockDb = createMockDb();
    setupSubscribeDb(mockDb);

    const { res } = await fetchMailingListRoute({
      mockDb,
      body: {
        email: 'reader@example.com',
        name: 'Reader',
        meta: { source: 'docs' },
      },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).toEqual(
      expect.objectContaining({
        mailingListId: LIST_ID,
        email: 'reader@example.com',
        name: 'Reader',
        meta: { source: 'docs' },
        status: 'pending',
        confirmedAt: null,
        unsubscribedAt: null,
      }),
    );

    expect(mockDb.run).toHaveBeenCalledTimes(1);
    expect(mockDb.bind).toHaveBeenLastCalledWith(
      expect.stringMatching(/^mls_/),
      LIST_ID,
      'reader@example.com',
      'Reader',
      JSON.stringify({ source: 'docs' }),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );

    expect(sendSystemEmail).toHaveBeenCalledWith(
      { apiKey: 'test-system-email-api-key', from: 'Pietru <noreply@pietru.dev>' },
      expect.objectContaining({
        to: 'reader@example.com',
        subject: 'Confirm your subscription to Pietru Updates',
        html: expect.stringContaining('/mailing-lists/confirm?token='),
        text: expect.stringContaining('/mailing-lists/confirm?token='),
      }),
    );
  });

  it('rejects invalid email addresses after authenticating and loading the target list', async () => {
    const mockDb = createMockDb();
    setupSubscribeDb(mockDb);

    const { res } = await fetchMailingListRoute({
      mockDb,
      body: {
        email: 'not-an-email',
        name: 'Reader',
      },
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('validation_error');
    expect(mockDb.run).not.toHaveBeenCalled();
    expect(sendSystemEmail).not.toHaveBeenCalled();
  });

  it('returns an existing confirmed subscriber without re-sending confirmation email', async () => {
    const confirmedSubscriber = {
      id: 'mls_existing',
      mailing_list_id: LIST_ID,
      email: 'reader@example.com',
      name: 'Reader',
      meta: JSON.stringify({ source: 'docs' }),
      status: 'confirmed',
      subscribed_at: '2026-05-18T00:00:00.000Z',
      confirmed_at: '2026-05-18T00:01:00.000Z',
      unsubscribed_at: null,
      created_at: '2026-05-18T00:00:00.000Z',
    };
    const mockDb = createMockDb();
    setupSubscribeDb(mockDb, confirmedSubscriber);

    const { res } = await fetchMailingListRoute({
      mockDb,
      body: {
        email: 'reader@example.com',
      },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: {
        id: 'mls_existing',
        mailingListId: LIST_ID,
        email: 'reader@example.com',
        name: 'Reader',
        meta: { source: 'docs' },
        status: 'confirmed',
        subscribedAt: '2026-05-18T00:00:00.000Z',
        confirmedAt: '2026-05-18T00:01:00.000Z',
        unsubscribedAt: null,
        createdAt: '2026-05-18T00:00:00.000Z',
      },
    });
    expect(mockDb.run).not.toHaveBeenCalled();
    expect(sendSystemEmail).not.toHaveBeenCalled();
  });
});
