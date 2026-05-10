export interface EmailHook {
  id: string
  project_id: string
  name: string
  is_active: boolean
  filter_type: 'tag' | 'from_domain' | 'subject_regex' | 'any'
  filter_value: string | null
  webhook_url: string
  webhook_secret: string | null
  webhook_headers_json: string | null
  created_at: string
  updated_at: string
}

export interface CreateEmailHookPayload {
  name: string
  filter_type: EmailHook['filter_type']
  filter_value?: string | null
  webhook_url: string
  webhook_secret?: string | null
  webhook_headers_json?: string | null
  is_active?: boolean
}

export interface UpdateEmailHookPayload {
  name?: string
  filter_type?: EmailHook['filter_type']
  filter_value?: string | null
  webhook_url?: string
  webhook_secret?: string | null
  webhook_headers_json?: string | null
  is_active?: boolean
}
