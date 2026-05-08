import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiRequest } from './client'

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('includes credentials and parses json', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: async () => ({ ok: true }),
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/auth/me')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8787/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('normalizes errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({ message: 'Unauthorized' }),
      }),
    )

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
    } satisfies Partial<ApiError>)
  })
})
