export interface Message {
  id: string
  projectId: string
  environment: string
  toAddress: string
  fromAddress: string
  subject: string
  status: string
  provider?: string | null
  error?: string | null
  createdAt: string
  sentAt?: string | null
}

export interface MessageEvent {
  id: string
  type: string
  provider?: string | null
  payloadJson?: unknown
  createdAt: string
}

export interface MessageDetail extends Message {
  replyTo?: string | null
  html?: string | null
  text?: string | null
  ccJson?: string[] | null
  bccJson?: string[] | null
  providerMessageId?: string | null
  tagsJson?: string[] | null
  events?: MessageEvent[]
}

export interface MessageFilters {
  environment?: string
  status?: string
  to?: string
  from?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  cursor?: string
}

export interface InboxMessage {
  id: string
  subject: string
  fromAddress: string
  toAddress: string
  createdAt: string
}
