/** Shape returned by the list endpoint (raw D1 columns) */
export interface ProviderConfig {
  id: string
  project_id: string
  provider_type: string
  mode: string
  environment: string
  default_from?: string | null
  allowed_domains_json?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProviderConfigPayload {
  providerType: string
  config: Record<string, unknown>
  mode: string
  environment: string
  defaultFrom: string
  allowedDomains: string[]
}
