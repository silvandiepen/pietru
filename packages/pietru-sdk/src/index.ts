// Types
export type {
  PietruThemeConfig,
  PietruTemplateId,
  PietruPredefinedTemplate,
  PietruCustomTemplate,
  PietruSendEmailOptions,
  PietruSendEmailResponse,
  PietruClientConfig,
  PietruMessageEvent,
  PietruWebhookPayload,
  PietruRenderResult,
} from './types.js'

// Theme
export { defaultTheme } from './theme.js'

// Templates
export { templates, getTemplate } from './templates/index.js'
export type { NewsletterContent } from './templates/newsletter.js'
export type { WelcomeContent } from './templates/welcome.js'
export type { VerificationContent } from './templates/verification.js'
export type { NotificationContent } from './templates/notification.js'
export type { MinimalContent } from './templates/minimal.js'

// Render
export { renderTemplate } from './render.js'

// Client
export { PietruClient } from './client.js'

// Webhook
export { verifyWebhookSignature } from './webhook.js'
