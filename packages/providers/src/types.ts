export interface OutgoingEmail {
  id?: string;
  to: string | string[];
  from: string;
  subject: string;
  html?: string | null;
  text?: string | null;
  cc?: string[];
  bcc?: string[];
  replyTo?: string | null;
  tags?: Record<string, string>;
}

export type ProviderType = 'resend' | 'ses';

export interface SesProviderConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  configurationSetName?: string | null;
  defaultMailFromDomain?: string | null;
}

export interface ProviderConfig {
  providerType: string;
  apiKey?: string;
  webhookSecret?: string;
  mode?: 'send' | 'capture' | 'send_and_capture';
  environment?: 'development' | 'preview' | 'production';
  defaultFrom?: string | null;
  allowedDomains?: string[] | null;

  // SES fields
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  configurationSetName?: string | null;
  defaultMailFromDomain?: string | null;
}

export interface ProviderSendResult {
  id: string;
  status: 'queued' | 'sent' | 'failed' | 'captured' | 'accepted';
  raw?: unknown;
}

export interface ProviderEvent {
  type: string;
  provider: string;
  providerMessageId: string | null;
  occurredAt: string;
  payload: unknown;
}

export interface MailProvider {
  sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult>;
  validateConfig(config: ProviderConfig): Promise<void>;
  handleWebhook?(payload: unknown, headers: Headers, config: ProviderConfig): Promise<ProviderEvent[]>;
}
