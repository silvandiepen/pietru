import type {
  API_KEY_PREFIXES,
  ENVIRONMENTS,
  MESSAGE_EVENT_TYPES,
  MESSAGE_STATUSES,
  SENDING_MODES,
} from './constants';

export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];
export type MessageStatus = (typeof MESSAGE_STATUSES)[keyof typeof MESSAGE_STATUSES];
export type MessageEventType = (typeof MESSAGE_EVENT_TYPES)[keyof typeof MESSAGE_EVENT_TYPES];
export type SendingMode = (typeof SENDING_MODES)[keyof typeof SENDING_MODES];
export type ApiKeyPrefix = (typeof API_KEY_PREFIXES)[keyof typeof API_KEY_PREFIXES];

export interface User {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  providerConfigId: string | null;
  environment: Environment;
  toAddress: string;
  fromAddress: string;
  replyTo: string | null;
  cc: string[];
  bcc: string[];
  subject: string;
  html: string | null;
  text: string | null;
  status: MessageStatus;
  provider: string | null;
  providerMessageId: string | null;
  error: string | null;
  tags: Record<string, string>;
  rawStorageKey: string | null;
  htmlStorageKey: string | null;
  textStorageKey: string | null;
  idempotencyKeyHash: string | null;
  createdAt: string;
  queuedAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
}

export interface MessageEvent {
  id: string;
  messageId: string;
  projectId: string;
  type: MessageEventType | string;
  provider: string | null;
  payload: unknown;
  payloadStorageKey: string | null;
  createdAt: string;
}

export interface ProviderConfig {
  providerType: string;
  apiKey: string;
  webhookSecret?: string;
  mode?: SendingMode;
  environment?: Environment;
  defaultFrom?: string | null;
  allowedDomains?: string[] | null;
}

export interface ProjectEnvironmentConfig {
  projectId: string;
  environment: Environment;
  mode: SendingMode;
  providerConfigId: string | null;
  defaultFrom: string | null;
  allowedDomains: string[];
}

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

export interface ProviderSendResult {
  id: string;
  status: MessageStatus | 'accepted';
  raw?: unknown;
}

export interface ProviderEvent {
  type: string;
  provider: string;
  providerMessageId: string | null;
  occurredAt: string;
  payload: unknown;
}

export interface EmailTemplate {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  subject: string;
  html: string | null;
  text: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailProvider {
  sendEmail(message: OutgoingEmail, config: ProviderConfig): Promise<ProviderSendResult>;
  validateConfig(config: ProviderConfig): Promise<void>;
  handleWebhook?(payload: unknown, headers: Headers, config: ProviderConfig): Promise<ProviderEvent[]>;
}
