export interface ApiErrorShape {
  message: string
  status: number
  details?: unknown
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor({ message, status, details }: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const API_BASE_URL = (import.meta.env.VITE_PIETRU_API_URL as string | undefined) || 'http://localhost:8787'

function normalizeUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  const versioned = path.startsWith('/') ? `/v1${path}` : `/v1/${path}`
  return `${API_BASE_URL}${versioned}`
}

function parseMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string') {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    // Handle API's { error: { code, message } } envelope
    if (obj.error && typeof obj.error === 'object') {
      const err = obj.error as Record<string, unknown>
      if (typeof err.message === 'string') return err.message
    }
  }

  return fallback
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(normalizeUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '')

  if (!response.ok) {
    throw new ApiError({
      message: parseMessage(payload, `Request failed with status ${response.status}`),
      status: response.status,
      details: payload,
    })
  }

  // Auto-unwrap the { data: ... } envelope that every API endpoint returns
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T
  }

  return payload as T
}
