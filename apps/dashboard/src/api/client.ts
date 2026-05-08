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

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function parseMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string') {
    return payload
  }

  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
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

  return payload as T
}
