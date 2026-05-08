export interface ApiKey {
  id: string
  name?: string | null
  keyPrefix: string
  environment: string
  createdAt: string
  revokedAt?: string | null
}

export interface ApiKeyCreatePayload {
  name?: string
  environment: string
}

export interface ApiKeyCreateResponse {
  id: string
  key: string
  keyPrefix: string
  environment: string
}
