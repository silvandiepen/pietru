import type { MailProvider, OutgoingEmail, ProviderConfig, ProviderEvent, ProviderSendResult } from './types';

const RESEND_API_BASE_URL = 'https://api.resend.com';

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

export class ResendProvider implements MailProvider {
  async sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult> {
    const response = await fetch(`${RESEND_API_BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'pietru-api/1.0',
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html ?? undefined,
        text: message.text ?? undefined,
        tags: Object.entries(message.tags ?? {}).map(([name, value]) => ({ name, value })),
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!response.ok || !payload?.id) {
      throw new Error(payload?.message ?? 'Failed to send email with Resend');
    }

    return {
      id: payload.id,
      status: 'sent',
      raw: payload,
    };
  }

  async validateConfig(config: ProviderConfig): Promise<void> {
    const response = await fetch(`${RESEND_API_BASE_URL}/domains`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'User-Agent': 'pietru-api/1.0',
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      const message = payload?.message ?? 'Invalid Resend configuration';
      // Send-only keys can't access /domains but are still valid for sending
      if (message.includes('restricted to only send emails')) {
        return;
      }
      throw new Error(message);
    }
  }

  async handleWebhook(payload: unknown, headers: Headers, config: ProviderConfig): Promise<ProviderEvent[]> {
    if (typeof payload !== 'string') {
      throw new Error('Webhook payload must be the raw request body');
    }

    if (!config.webhookSecret) {
      throw new Error('Missing Resend webhook secret');
    }

    const messageId = headers.get('svix-id');
    const timestamp = headers.get('svix-timestamp');
    const signatureHeader = headers.get('svix-signature');
    if (!messageId || !timestamp || !signatureHeader) {
      throw new Error('Missing webhook signature headers');
    }

    const signedContent = `${messageId}.${timestamp}.${payload}`;
    const expected = await hmacSha256Base64(config.webhookSecret, signedContent);
    const signatures = signatureHeader
      .split(' ')
      .flatMap((part) => part.split(','))
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.split(','))
      .flat()
      .map((part) => part.trim())
      .filter((part) => part.startsWith('v1,') || part.startsWith('v1='));

    const verified = signatures.some((part) => {
      const candidate = part.includes(',') ? part.split(',')[1] : part.split('=')[1];
      return candidate ? timingSafeEqual(candidate, expected) : false;
    });

    if (!verified) {
      throw new Error('Invalid webhook signature');
    }

    const parsed = JSON.parse(payload) as {
      type?: string;
      created_at?: string;
      data?: { email_id?: string };
    };

    return [
      {
        type: parsed.type ?? 'unknown',
        provider: 'resend',
        providerMessageId: parsed.data?.email_id ?? null,
        occurredAt: parsed.created_at ?? new Date().toISOString(),
        payload: parsed,
      },
    ];
  }
}
