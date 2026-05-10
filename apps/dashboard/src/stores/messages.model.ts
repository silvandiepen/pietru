export interface Message {
  id: string
  project_id: string
  environment: string
  to_address: string
  from_address: string
  subject: string
  status: string
  provider?: string | null
  error?: string | null
  created_at: string
  sent_at?: string | null
}

export interface MessageEvent {
  id: string
  type: string
  provider?: string | null
  payload_json?: string | null
  created_at: string
}

export interface MessageDetail extends Message {
  reply_to?: string | null
  html?: string | null
  text?: string | null
  cc_json?: string[] | null
  bcc_json?: string[] | null
  provider_message_id?: string | null
  tags_json?: string[] | null
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
  from_address: string
  to_address: string
  created_at: string
}
