import { sendSystemEmail } from '@pietru/core';
import { describe, expect, it, vi } from 'vitest';
import { mailingListRoutes } from '../routes/mailing-list';
import { createMockEnv } from './helpers';

vi.mock('@pietru/core', () => ({
  sendSystemEmail: vi.fn().mockResolvedValue({ id: 'email_123' }),
}));

async function fetchMailingListRoute(body: unknown) {
  const req = new Request('http://localhost/mailing-list/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'vitest',
    },
    body: JSON.stringify(body),
  });

  return mailingListRoutes.fetch(req, createMockEnv(), {} as ExecutionContext);
}

describe('POST /mailing-list/subscriptions', () => {
  it('sends a subscription request through the system email API', async () => {
    const res = await fetchMailingListRoute({
      email: 'reader@example.com',
      list: 'pietru-updates',
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: { ok: true } });
    expect(sendSystemEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-system-email-api-key',
        from: 'Pietru <noreply@pietru.dev>',
      }),
      expect.objectContaining({
        to: 'hello@hakobs.com',
        subject: 'New Pietru mailing list signup: reader@example.com',
      }),
    );
  });

  it('rejects invalid email addresses', async () => {
    const res = await fetchMailingListRoute({
      email: 'not-an-email',
      list: 'pietru-updates',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('validation_error');
  });
});
