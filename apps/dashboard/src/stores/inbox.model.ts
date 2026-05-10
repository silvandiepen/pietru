export interface InboxMessage {
  id: string
  project_id: string | null
  to_address: string
  from_address: string
  subject: string
  status: string
  provider: string | null
  created_at: string
  sent_at: string | null
}

export interface InboxMessageDetail extends InboxMessage {
  html?: string | null
  text?: string | null
  reply_to?: string | null
  cc_json?: string[] | null
  bcc_json?: string[] | null
  error?: string | null
  tags_json?: string[] | null
  events: InboxMessageEvent[]
}

export interface InboxMessageEvent {
  id: string
  type: string
  provider?: string | null
  payload_json?: string | null
  created_at: string
}

export interface InboxFilters {
  project?: string
  tag?: string
  search?: string
  status?: string
  cursor?: string
}
