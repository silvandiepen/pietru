export interface AuthUser {
  id: string
  email: string
  emailVerifiedAt?: string | null
  createdAt?: string
}

export interface AuthSession {
  id: string
  createdAt: string
  expiresAt: string
  revokedAt?: string | null
  current?: boolean
  userAgent?: string | null
  ipAddress?: string | null
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
