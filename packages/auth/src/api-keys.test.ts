import { describe, it, expect } from 'vitest';
import { hashApiKey, generateApiKey, generateAccountApiKey } from './api-keys.js';

describe('hashApiKey', () => {
  it('returns a hex-encoded SHA-256 hash', async () => {
    const hash = await hashApiKey('test-key');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces consistent hashes for the same input', async () => {
    const hash1 = await hashApiKey('my-api-key');
    const hash2 = await hashApiKey('my-api-key');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashApiKey('key-one');
    const hash2 = await hashApiKey('key-two');
    expect(hash1).not.toBe(hash2);
  });
});

describe('generateApiKey', () => {
  it('generates a production key with correct prefix', async () => {
    const result = await generateApiKey('production');
    expect(result.key).toMatch(/^mg_pk_live_/);
    expect(result.prefix).toBe('mg_pk_live_');
  });

  it('generates a development key with correct prefix', async () => {
    const result = await generateApiKey('development');
    expect(result.key).toMatch(/^mg_pk_test_/);
    expect(result.prefix).toBe('mg_pk_test_');
  });

  it('generates a preview key with test prefix', async () => {
    const result = await generateApiKey('preview');
    expect(result.key).toMatch(/^mg_pk_test_/);
    expect(result.prefix).toBe('mg_pk_test_');
  });

  it('key includes prefix + 32 random chars', async () => {
    const result = await generateApiKey('production');
    expect(result.key.length).toBe('mg_pk_live_'.length + 32);
  });

  it('returns a valid hash', async () => {
    const result = await generateApiKey('development');
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hash matches direct hashApiKey call', async () => {
    const result = await generateApiKey('production');
    const directHash = await hashApiKey(result.key);
    expect(result.hash).toBe(directHash);
  });

  it('generates unique keys on successive calls', async () => {
    const results = await Promise.all([generateApiKey('production'), generateApiKey('production')]);
    expect(results[0].key).not.toBe(results[1].key);
    expect(results[0].hash).not.toBe(results[1].hash);
  });
});

describe('generateAccountApiKey', () => {
  it('generates a key with the account prefix', async () => {
    const result = await generateAccountApiKey();
    expect(result.key).toMatch(/^mg_ak_/);
    expect(result.prefix).toBe('mg_ak_');
  });

  it('key includes prefix + 32 random chars', async () => {
    const result = await generateAccountApiKey();
    expect(result.key.length).toBe('mg_ak_'.length + 32);
  });

  it('returns a valid hash', async () => {
    const result = await generateAccountApiKey();
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hash matches direct hashApiKey call', async () => {
    const result = await generateAccountApiKey();
    const directHash = await hashApiKey(result.key);
    expect(result.hash).toBe(directHash);
  });
});
