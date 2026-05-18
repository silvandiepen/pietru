import { sendPasswordResetEmail, sendVerificationEmail } from '@pietru/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authRoutes } from '../routes/auth';
import { createMockDb, createMockEnv } from './helpers';

vi.mock('@pietru/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pietru/core')>();
  return {
    ...actual,
    sendVerificationEmail: vi.fn().mockResolvedValue({ id: 'email_verify_123' }),
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ id: 'email_reset_123' }),
  };
});

type TestExecutionContext = {
  props: Record<string, unknown>;
  waitUntil: ReturnType<typeof vi.fn<(promise: Promise<unknown>) => void>>;
  passThroughOnException: ReturnType<typeof vi.fn>;
};

function createExecutionCtx(): TestExecutionContext {
  return {
    props: {},
    waitUntil: vi.fn((promise: Promise<unknown>) => {
      void promise;
    }),
    passThroughOnException: vi.fn(),
  } as unknown as TestExecutionContext;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('auth system emails', () => {
  it('tracks signup verification email send with executionCtx.waitUntil()', async () => {
    const mockDb = createMockDb();
    mockDb.first = vi.fn().mockResolvedValue(null);
    const env = createMockEnv({ DB: mockDb as never });
    const executionCtx = createExecutionCtx();
    const email = 'new-reader@example.com';

    const res = await authRoutes.fetch(
      new Request('http://localhost/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'StrongPassword!123' }),
      }),
      env,
      executionCtx,
    );

    expect(res.status).toBe(201);
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      { apiKey: 'test-system-email-api-key', from: 'Pietru <noreply@pietru.dev>' },
      expect.objectContaining({
        to: email,
        token: expect.any(String),
        dashboardUrl: 'https://app.pietru.dev',
      }),
    );
    expect(executionCtx.waitUntil).toHaveBeenCalledTimes(1);
    await executionCtx.waitUntil.mock.calls[0]?.[0];
  });

  it('tracks password reset email send with executionCtx.waitUntil()', async () => {
    const mockDb = createMockDb();
    mockDb.first = vi.fn().mockResolvedValue({ id: 'usr_123' });
    const env = createMockEnv({ DB: mockDb as never });
    const executionCtx = createExecutionCtx();
    const email = 'existing-reader@example.com';

    const res = await authRoutes.fetch(
      new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      { apiKey: 'test-system-email-api-key', from: 'Pietru <noreply@pietru.dev>' },
      expect.objectContaining({
        to: email,
        token: expect.any(String),
        dashboardUrl: 'https://app.pietru.dev',
      }),
    );
    expect(executionCtx.waitUntil).toHaveBeenCalledTimes(1);
    await executionCtx.waitUntil.mock.calls[0]?.[0];
  });
});
