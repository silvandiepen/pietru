export interface PietruThemeConfig {
  logoUrl?: string
  logoWidth?: string
  logoAlt?: string
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  footerBgColor?: string
  linkColor?: string
  fontFamily?: string
  headingFont?: string
  companyName?: string
  footerText?: string
  socialLinks?: Record<string, string>
  addressLine1?: string
  addressLine2?: string
  city?: string
  country?: string
  unsubscribePageTitle?: string
  unsubscribePageMessage?: string
  unsubscribeButtonColor?: string
}

export type PietruTemplateId =
  | 'newsletter'
  | 'welcome'
  | 'verification'
  | 'notification'
  | 'minimal'

export interface PietruPredefinedTemplate {
  id: PietruTemplateId
  content: Record<string, unknown>
}

export interface PietruCustomTemplate {
  html: string
  text?: string
}

export interface PietruSendEmailOptions {
  to: string | string[]
  from: { name: string; email: string }
  replyTo?: string
  template: PietruPredefinedTemplate | PietruCustomTemplate
  theme?: PietruThemeConfig
  variables?: Record<string, string>
  tags?: string[]
  metadata?: Record<string, string>
}

export interface PietruSendEmailResponse {
  messageId: string
  status: 'queued' | 'sent'
}

export interface PietruClientConfig {
  apiKey: string
  projectId?: string
  baseUrl?: string
}

export type PietruMessageEvent =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'unsubscribed'
  | 'complained'

export interface PietruWebhookPayload {
  event: PietruMessageEvent
  messageId: string
  recipient: string
  timestamp: string
  metadata?: Record<string, string>
  tags?: string[]
  data?: Record<string, unknown>
}

export interface PietruRenderResult {
  html: string
  text: string
}
