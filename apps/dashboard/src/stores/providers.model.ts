export interface ProviderConfig {
  id: string
  providerType: string
  mode: string
  environment: string
  defaultFrom?: string | null
  allowedDomains?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ProviderConfigPayload {
  providerType: string
  config: Record<string, unknown>
  mode: string
  environment: string
  defaultFrom: string
  allowedDomains: string[]
}
