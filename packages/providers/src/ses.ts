import type { MailProvider, OutgoingEmail, ProviderConfig, ProviderSendResult } from './types';
import { signAwsRequest } from './ses.signing';

const SES_API_VERSION = 'v2';

function sesEndpoint(region: string, path: string): string {
  return `https://email.${region}.amazonaws.com/${SES_API_VERSION}${path}`;
}

function normalizeArray(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

function getSesCredentials(config: ProviderConfig): {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
} {
  if (!config.region) {
    throw new Error('SES region is required');
  }
  if (!config.accessKeyId) {
    throw new Error('SES access key ID is required');
  }
  if (!config.secretAccessKey) {
    throw new Error('SES secret access key is required');
  }
  return {
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  };
}

export class SesProvider implements MailProvider {
  async sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult> {
    const { region, accessKeyId, secretAccessKey } = getSesCredentials(config);

    const body = JSON.stringify({
      FromEmailAddress: message.from,
      Destination: {
        ToAddresses: normalizeArray(message.to),
        CcAddresses: normalizeArray(message.cc),
        BccAddresses: normalizeArray(message.bcc),
      },
      ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: 'UTF-8' },
          Body: {
            Html: message.html ? { Data: message.html, Charset: 'UTF-8' } : undefined,
            Text: message.text ? { Data: message.text, Charset: 'UTF-8' } : undefined,
          },
        },
      },
      EmailTags: Object.entries(message.tags ?? {}).map(([Name, Value]) => ({ Name, Value })),
      ConfigurationSetName: config.configurationSetName ?? undefined,
    });

    const url = sesEndpoint(region, '/email/outbound-emails');
    const { authorization, amzDate } = await signAwsRequest(
      'POST',
      url,
      body,
      region,
      accessKeyId,
      secretAccessKey,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Date': amzDate,
        Authorization: authorization,
      },
      body,
    });

    const payload = (await response.json().catch(() => null)) as { MessageId?: string; message?: string; Error?: { Message?: string } } | null;

    if (!response.ok) {
      const errorMessage = payload?.Error?.Message ?? payload?.message ?? `SES request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!payload?.MessageId) {
      throw new Error('SES did not return a MessageId');
    }

    return {
      id: payload.MessageId,
      status: 'sent',
      raw: payload,
    };
  }

  async validateConfig(config: ProviderConfig): Promise<void> {
    const { region, accessKeyId, secretAccessKey } = getSesCredentials(config);

    const url = sesEndpoint(region, '/email/identities');
    const body = '';

    const { authorization, amzDate } = await signAwsRequest(
      'GET',
      url,
      body,
      region,
      accessKeyId,
      secretAccessKey,
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Date': amzDate,
        Authorization: authorization,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; Error?: { Message?: string } } | null;
      const errorMessage = payload?.Error?.Message ?? payload?.message ?? `SES credentials validation failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
  }
}
