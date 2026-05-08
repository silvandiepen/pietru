export const MESSAGE_STATUSES = {
  queued: 'queued',
  sent: 'sent',
  failed: 'failed',
  captured: 'captured',
} as const;

export const MESSAGE_EVENT_TYPES = {
  created: 'created',
  queued: 'queued',
  sent: 'sent',
  failed: 'failed',
  delivered: 'delivered',
  opened: 'opened',
  clicked: 'clicked',
  complained: 'complained',
  bounced: 'bounced',
  received: 'received',
} as const;

export const ENVIRONMENTS = {
  development: 'development',
  preview: 'preview',
  production: 'production',
} as const;

export const SENDING_MODES = {
  send: 'send',
  capture: 'capture',
  sendAndCapture: 'send_and_capture',
} as const;

export const API_KEY_PREFIXES = {
  production: 'mg_pk_live_',
  development: 'mg_pk_test_',
  preview: 'mg_pk_test_',
} as const;
