export interface AuthUser {
  id: string
  email: string
  is_admin?: boolean
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
}

/** CamelCase variant returned by login/register endpoints which explicitly map fields */
export interface AuthUserResponse {
  id: string
  email: string
  isAdmin?: boolean
  emailVerifiedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AuthSession {
  id: string
  created_at: string
  expires_at: string
  revoked_at?: string | null
  current?: boolean
  user_agent?: string | null
  ip_address?: string | null
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
