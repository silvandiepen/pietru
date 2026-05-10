import type { MailProvider, OutgoingEmail, ProviderConfig, ProviderEvent, ProviderSendResult } from './types';

const MAILGUN_API_BASE_URL = 'https://api.mailgun.net/v3';

function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function hmacSha256Base64(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64FromBytes(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function getMailgunDomain(config: ProviderConfig): string {
  if (!config.domain) {
    throw new Error('Mailgun domain is required');
  }
  return config.domain;
}

function toArray(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(', ') : value;
}

export class MailgunProvider implements MailProvider {
  async sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult> {
    const domain = getMailgunDomain(config);
    const form = new URLSearchParams();
    form.set('from', message.from);
    form.set('to', toArray(message.to) ?? '');
    form.set('subject', message.subject);
    if (message.html) form.set('html', message.html);
    if (message.text) form.set('text', message.text);
    if (message.cc?.length) form.set('cc', toArray(message.cc)!);
    if (message.bcc?.length) form.set('bcc', toArray(message.bcc)!);
    if (message.replyTo) form.set('reply-to', message.replyTo);
    if (message.tags && Object.keys(message.tags).length > 0) {
      form.set('tag', Object.values(message.tags).join(', '));
    }

    const response = await fetch(`${MAILGUN_API_BASE_URL}/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${config.apiKey}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'pietru-api/1.0',
      },
      body: form.toString(),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!response.ok || !payload?.id) {
      throw new Error(payload?.message ?? 'Failed to send email with Mailgun');
    }

    return {
      id: payload.id,
      status: 'queued',
      raw: payload,
    };
  }

  async validateConfig(config: ProviderConfig): Promise<void> {
    const response = await fetch(`${MAILGUN_API_BASE_URL}/domains`, {
      headers: {
        Authorization: `Basic ${btoa(`api:${config.apiKey}`)}`,
        'User-Agent': 'pietru-api/1.0',
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message ?? 'Invalid Mailgun configuration');
    }
  }

  async handleWebhook(payload: unknown, headers: Headers, config: ProviderConfig): Promise<ProviderEvent[]> {
    if (!config.webhookSecret) {
      throw new Error('Missing Mailgun webhook signing key');
    }

    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Webhook payload must be an object');
    }

    const data = payload as Record<string, unknown>;
    const timestamp = headers.get('timestamp');
    const token = headers.get('token');
    const signature = headers.get('signature');

    if (!timestamp || !token || !signature) {
      throw new Error('Missing Mailgun webhook signature headers');
    }

    // Reject payloads older than 5 minutes to prevent replay attacks
    const ts = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Number.isNaN(ts) || now - ts > 300 || ts - now > 60) {
      throw new Error('Mailgun webhook timestamp too far from current time');
    }

    const signedContent = `${timestamp}${token}`;
    const expected = await hmacSha256Base64(config.webhookSecret, signedContent);

    if (!timingSafeEqual(signature, expected)) {
      throw new Error('Invalid Mailgun webhook signature');
    }

    const event = data['event'] as string | undefined ?? 'unknown';
    const messageId = (data['message-id'] as string | undefined) ?? null;
    const eventTimestamp = (data['timestamp'] as number | undefined) ?? Date.now();

    return [
      {
        type: event,
        provider: 'mailgun',
        providerMessageId: messageId,
        occurredAt: new Date(eventTimestamp * 1000).toISOString(),
        payload: data,
      },
    ];
  }
}
