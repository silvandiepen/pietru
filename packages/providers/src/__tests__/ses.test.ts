import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SesProvider } from '../ses';
import { signAwsRequest } from '../ses.signing';
import type { ProviderConfig, OutgoingEmail } from '../types';

// ── Shared helpers ──────────────────────────────────────────────

const sesConfig: ProviderConfig = {
  providerType: 'ses',
  region: 'eu-west-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};

const sampleEmail: OutgoingEmail = {
  id: 'msg_123',
  to: 'user@example.com',
  from: 'sender@example.com',
  subject: 'Hello',
  html: '<p>Hi there</p>',
  text: 'Hi there',
  cc: ['cc@example.com'],
  replyTo: 'reply@example.com',
  tags: { campaign: 'welcome' },
};

// ── signAwsRequest ─────────────────────────────────────────────

describe('signAwsRequest', () => {
  it('returns authorization header and amz-date', async () => {
    const result = await signAwsRequest(
      'POST',
      'https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails',
      '{"test": true}',
      'eu-west-1',
      'AKIAIOSFODNN7EXAMPLE',
      'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    );

    expect(result.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\//);
    expect(result.authorization).toContain('SignedHeaders=content-type;host;x-amz-date');
    expect(result.authorization).toContain('Signature=');
    expect(result.amzDate).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it('produces consistent signatures for same inputs', async () => {
    // Freeze time so both calls produce the same timestamp
    const now = new Date('2026-01-15T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const url = 'https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails';
    const body = '{"FromEmailAddress":"test@example.com"}';

    const r1 = await signAwsRequest('POST', url, body, 'eu-west-1', 'AKIAIOSFODNN7EXAMPLE', 'secret');
    const r2 = await signAwsRequest('POST', url, body, 'eu-west-1', 'AKIAIOSFODNN7EXAMPLE', 'secret');

    expect(r1.authorization).toBe(r2.authorization);
    expect(r1.amzDate).toBe(r2.amzDate);

    vi.useRealTimers();
  });

  it('different secrets produce different signatures', async () => {
    const now = new Date('2026-01-15T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const url = 'https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails';
    const body = '{"test": true}';

    const r1 = await signAwsRequest('POST', url, body, 'eu-west-1', 'AKIAIOSFODNN7EXAMPLE', 'secret1');
    const r2 = await signAwsRequest('POST', url, body, 'eu-west-1', 'AKIAIOSFODNN7EXAMPLE', 'secret2');

    expect(r1.authorization).not.toBe(r2.authorization);

    vi.useRealTimers();
  });
});

// ── SesProvider.sendEmail ──────────────────────────────────────

describe('SesProvider', () => {
  let provider: SesProvider;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new SesProvider();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendEmail', () => {
    it('sends email via SES v2 API with correct payload structure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ MessageId: 'ses-msg-001' }),
      });

      const result = await provider.sendEmail(sampleEmail, sesConfig);

      expect(result.id).toBe('ses-msg-001');
      expect(result.status).toBe('sent');
      expect(fetchSpy).toHaveBeenCalledOnce();

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://email.eu-west-1.amazonaws.com/v2/email/outbound-emails');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-Amz-Date']).toMatch(/^\d{8}T\d{6}Z$/);
      expect(options.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256/);

      const body = JSON.parse(options.body);
      expect(body.FromEmailAddress).toBe('sender@example.com');
      expect(body.Destination.ToAddresses).toEqual(['user@example.com']);
      expect(body.Destination.CcAddresses).toEqual(['cc@example.com']);
      expect(body.ReplyToAddresses).toEqual(['reply@example.com']);
      expect(body.Content.Simple.Subject.Data).toBe('Hello');
      expect(body.Content.Simple.Body.Html.Data).toBe('<p>Hi there</p>');
      expect(body.Content.Simple.Body.Text.Data).toBe('Hi there');
      expect(body.EmailTags).toEqual([{ Name: 'campaign', Value: 'welcome' }]);
    });

    it('handles array "to" field', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ MessageId: 'ses-msg-002' }),
      });

      const result = await provider.sendEmail(
        { ...sampleEmail, to: ['a@example.com', 'b@example.com'] },
        sesConfig,
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.Destination.ToAddresses).toEqual(['a@example.com', 'b@example.com']);
    });

    it('handles missing cc, bcc, replyTo, tags gracefully', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ MessageId: 'ses-msg-003' }),
      });

      const minimal: OutgoingEmail = {
        to: 'user@example.com',
        from: 'sender@example.com',
        subject: 'Minimal',
      };

      await provider.sendEmail(minimal, sesConfig);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.Destination.CcAddresses).toBeUndefined();
      expect(body.Destination.BccAddresses).toBeUndefined();
      expect(body.ReplyToAddresses).toBeUndefined();
      expect(body.EmailTags).toEqual([]);
      expect(body.Content.Simple.Body.Html).toBeUndefined();
      expect(body.Content.Simple.Body.Text).toBeUndefined();
    });

    it('includes ConfigurationSetName when set', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ MessageId: 'ses-msg-004' }),
      });

      await provider.sendEmail(sampleEmail, { ...sesConfig, configurationSetName: 'my-config-set' });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.ConfigurationSetName).toBe('my-config-set');
    });

    it('throws when SES returns error with Error.Message', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ Error: { Message: 'Missing required parameter' } }),
      });

      await expect(provider.sendEmail(sampleEmail, sesConfig)).rejects.toThrow('Missing required parameter');
    });

    it('throws when SES returns error with plain message', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Access denied' }),
      });

      await expect(provider.sendEmail(sampleEmail, sesConfig)).rejects.toThrow('Access denied');
    });

    it('throws with status code when response has no body', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => null,
      });

      await expect(provider.sendEmail(sampleEmail, sesConfig)).rejects.toThrow('SES request failed with status 500');
    });

    it('throws when SES returns no MessageId in success response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ SomeOtherField: 'value' }),
      });

      await expect(provider.sendEmail(sampleEmail, sesConfig)).rejects.toThrow('SES did not return a MessageId');
    });

    it('uses correct endpoint for different regions', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ MessageId: 'ses-msg-us' }),
      });

      await provider.sendEmail(sampleEmail, { ...sesConfig, region: 'us-east-1' });

      const url = fetchSpy.mock.calls[0][0];
      expect(url).toBe('https://email.us-east-1.amazonaws.com/v2/email/outbound-emails');
    });

    it('throws when region is missing', async () => {
      const badConfig: ProviderConfig = { providerType: 'ses' };
      await expect(provider.sendEmail(sampleEmail, badConfig)).rejects.toThrow('SES region is required');
    });

    it('throws when accessKeyId is missing', async () => {
      const badConfig: ProviderConfig = { providerType: 'ses', region: 'eu-west-1' };
      await expect(provider.sendEmail(sampleEmail, badConfig)).rejects.toThrow('SES access key ID is required');
    });

    it('throws when secretAccessKey is missing', async () => {
      const badConfig: ProviderConfig = { providerType: 'ses', region: 'eu-west-1', accessKeyId: 'AKIA' };
      await expect(provider.sendEmail(sampleEmail, badConfig)).rejects.toThrow('SES secret access key is required');
    });
  });

  describe('validateConfig', () => {
    it('resolves on successful validation (200)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ EmailIdentities: [] }),
      });

      await expect(provider.validateConfig(sesConfig)).resolves.toBeUndefined();
      expect(fetchSpy).toHaveBeenCalledOnce();

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://email.eu-west-1.amazonaws.com/v2/email/identities');
      expect(options.method).toBe('GET');
    });

    it('throws on failed validation (403)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ Error: { Message: 'Invalid credentials' } }),
      });

      await expect(provider.validateConfig(sesConfig)).rejects.toThrow('Invalid credentials');
    });

    it('throws when region is missing', async () => {
      const badConfig: ProviderConfig = { providerType: 'ses' };
      await expect(provider.validateConfig(badConfig)).rejects.toThrow('SES region is required');
    });
  });
});
