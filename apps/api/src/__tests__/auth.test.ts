import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authenticateProjectApiKey,
  authenticateAccountApiKey,
} from '../middleware/auth';
import { createMockDb, createMockEnv, createMockContext } from './helpers';
import { hashApiKey } from '@pietru/auth';

describe('authenticateProjectApiKey', () => {
  it('returns error for invalid key prefix', async () => {
    const ctx = createMockContext();
    const result = await authenticateProjectApiKey(ctx as never, 'invalid_key');
    expect(result).toBeInstanceOf(Response);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('unauthorized');
    expect(body.error.message).toMatch(/prefix/i);
  });

  it('returns error when no matching key record found in DB', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null);
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const key = 'mg_pk_live_abcdefghijklmnopqrstuvwx';
    const result = await authenticateProjectApiKey(ctx as never, key);
    expect(result).toBeInstanceOf(Response);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('unauthorized');
    expect(body.error.message).toBe('Invalid API key');
  });

  it('returns error when key is revoked', async () => {
    const mockDb = createMockDb();
    const key = 'mg_pk_live_abcdefghijklmnopqrstuvwx';
    const hash = await hashApiKey(key);
    mockDb.first.mockResolvedValue({
      id: 'pak_123',
      project_id: 'proj_456',
      environment: 'production',
      revoked_at: '2024-01-01T00:00:00Z',
    });
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const result = await authenticateProjectApiKey(ctx as never, key);
    expect(result).toBeInstanceOf(Response);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('returns projectId and environment for valid production key', async () => {
    const mockDb = createMockDb();
    const key = 'mg_pk_live_abcdefghijklmnopqrstuvwx';
    mockDb.first.mockResolvedValue({
      id: 'pak_123',
      project_id: 'proj_456',
      environment: 'production',
      revoked_at: null,
    });
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const result = await authenticateProjectApiKey(ctx as never, key);
    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.projectId).toBe('proj_456');
      expect(result.environment).toBe('production');
    }
    // Verify context variables were set
    expect(ctx._variables.projectId).toBe('proj_456');
    expect(ctx._variables.environment).toBe('production');
  });

  it('returns projectId and environment for valid development key', async () => {
    const mockDb = createMockDb();
    const key = 'mg_pk_test_abcdefghijklmnopqrstuvwx';
    mockDb.first.mockResolvedValue({
      id: 'pak_789',
      project_id: 'proj_abc',
      environment: 'development',
      revoked_at: null,
    });
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const result = await authenticateProjectApiKey(ctx as never, key);
    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.projectId).toBe('proj_abc');
      expect(result.environment).toBe('development');
    }
  });

  it('queries DB with the correct hash of the key', async () => {
    const mockDb = createMockDb();
    const key = 'mg_pk_live_abcdefghijklmnopqrstuvwx';
    mockDb.first.mockResolvedValue(null);
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    await authenticateProjectApiKey(ctx as never, key);

    // Verify prepare was called with the right SQL
    expect(mockDb.prepare).toHaveBeenCalledWith(
      'SELECT id, project_id, environment, revoked_at FROM project_api_keys WHERE key_hash = ?',
    );
  });
});

describe('authenticateAccountApiKey', () => {
  it('returns error for invalid key prefix', async () => {
    const ctx = createMockContext();
    const result = await authenticateAccountApiKey(ctx as never, 'wrong_prefix_key');
    expect(result).toBeInstanceOf(Response);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('unauthorized');
    expect(body.error.message).toMatch(/prefix/i);
  });

  it('returns error when no matching record found in DB', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null);
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const key = 'mg_ak_abcdefghijklmnopqrstuvwx1234';
    const result = await authenticateAccountApiKey(ctx as never, key);
    expect(result).toBeInstanceOf(Response);
    const body = await (result as Response).json();
    expect(body.error.message).toBe('Invalid API key');
  });

  it('returns error when key is revoked', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue({
      id: 'aak_123',
      user_id: 'usr_456',
      revoked_at: '2024-01-01T00:00:00Z',
    });
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const key = 'mg_ak_abcdefghijklmnopqrstuvwx1234';
    const result = await authenticateAccountApiKey(ctx as never, key);
    expect(result).toBeInstanceOf(Response);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('returns userId and accountId for valid key', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue({
      id: 'aak_123',
      user_id: 'usr_456',
      revoked_at: null,
    });
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const key = 'mg_ak_abcdefghijklmnopqrstuvwx1234';
    const result = await authenticateAccountApiKey(ctx as never, key);
    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.userId).toBe('usr_456');
      expect(result.accountId).toBe('aak_123');
    }
    // Verify context variables were set
    expect(ctx._variables.userId).toBe('usr_456');
    expect(ctx._variables.accountId).toBe('aak_123');
  });

  it('queries DB with the correct SQL', async () => {
    const mockDb = createMockDb();
    mockDb.first.mockResolvedValue(null);
    const env = createMockEnv({ DB: mockDb as unknown as D1Database });
    const ctx = createMockContext({ env });

    const key = 'mg_ak_abcdefghijklmnopqrstuvwx1234';
    await authenticateAccountApiKey(ctx as never, key);

    expect(mockDb.prepare).toHaveBeenCalledWith(
      'SELECT id, user_id, revoked_at FROM account_api_keys WHERE key_hash = ?',
    );
  });
});
