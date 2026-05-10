/** Shape returned by the list endpoint (raw D1 columns) */
export interface ApiKey {
  id: string
  name?: string | null
  key_prefix: string
  environment: string
  created_at: string
  revoked_at?: string | null
}

export interface ApiKeyCreatePayload {
  name?: string
  environment: string
}

/** Shape returned by the create endpoint (camelCase) */
export interface ApiKeyCreateResponse {
  id: string
  key: string
  keyPrefix: string
  environment: string
  createdAt: string
}
