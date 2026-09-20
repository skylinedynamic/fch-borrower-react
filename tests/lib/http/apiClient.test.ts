import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

vi.mock('../../../src/lib/auth', () => ({
  getToken: vi.fn(() => ''),
  clearAuth: vi.fn(),
}))
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() },
}))

import { getToken, clearAuth } from '../../../src/lib/auth'
import { toast } from 'react-toastify'
import { apiClient } from '../../../src/lib/http/apiClient'

// axios exposes registered interceptors via this internal `handlers` array;
// invoking them directly tests the interceptor logic without a live request.
const requestInterceptor = (apiClient.interceptors.request as any).handlers[0]
const responseInterceptor = (apiClient.interceptors.response as any).handlers[0]

const makeConfig = (headers: Record<string, string> = {}): InternalAxiosRequestConfig =>
  ({ headers } as InternalAxiosRequestConfig)

const makeError = (overrides: Partial<AxiosError> = {}): AxiosError =>
  ({ config: makeConfig(), ...overrides } as AxiosError)

describe('apiClient request interceptor', () => {
  afterEach(() => vi.clearAllMocks())

  it('attaches the Bearer token when one is present', () => {
    vi.mocked(getToken).mockReturnValue('token-123')
    const config = requestInterceptor.fulfilled(makeConfig())
    expect(config.headers.Authorization).toBe('Bearer token-123')
  })

  it('omits the Authorization header when there is no token', () => {
    vi.mocked(getToken).mockReturnValue('')
    const config = requestInterceptor.fulfilled(makeConfig())
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('always sets the X-Timezone header', () => {
    const config = requestInterceptor.fulfilled(makeConfig())
    expect(config.headers['X-Timezone']).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
  })
})

describe('apiClient response interceptor', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // jsdom's real location.assign throws "not implemented"; stub it with a
    // configurable replacement so navigation calls can be asserted on.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/dashboard', assign: vi.fn() },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
  })

  it('passes successful responses through unchanged', () => {
    const response = { data: { ok: true } }
    expect(responseInterceptor.fulfilled(response)).toBe(response)
  })

  it('toasts an offline message when the browser is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const error = makeError({ code: 'ERR_NETWORK' })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(toast.error).toHaveBeenCalledWith('You appear to be offline. Please reconnect and try again.', {
      toastId: 'network-error',
    })
  })

  it('toasts an unreachable-server message when online but the network errors', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const error = makeError({ code: 'ERR_NETWORK' })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(toast.error).toHaveBeenCalledWith(
      'Network error: Unable to reach the server. Please try again later.',
      { toastId: 'network-error' }
    )
  })

  it('does not toast a network error when the server actually responded', async () => {
    const error = makeError({ response: { status: 500, data: {} } as any })
    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)
    expect(toast.error).not.toHaveBeenCalledWith(expect.anything(), { toastId: 'network-error' })
  })

  it('on 401: clears auth and redirects to /login', async () => {
    window.location.pathname = '/dashboard'
    const error = makeError({ response: { status: 401, data: {} } as any })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(clearAuth).toHaveBeenCalled()
    expect(window.location.assign).toHaveBeenCalledWith('/login')
  })

  it('on 401: does not redirect again when already on /login (no redirect loop)', async () => {
    window.location.pathname = '/login'
    const error = makeError({ response: { status: 401, data: {} } as any })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(clearAuth).toHaveBeenCalled()
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('on 403: shows the server message and does not clear auth', async () => {
    const error = makeError({ response: { status: 403, data: { message: 'Not allowed' } } as any })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(clearAuth).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Not allowed', { toastId: 'forbidden-error' })
  })

  it('on 403: falls back to a generic message when the server sends none', async () => {
    const error = makeError({ response: { status: 403, data: {} } as any })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(toast.error).toHaveBeenCalledWith('You do not have permission to perform this action.', {
      toastId: 'forbidden-error',
    })
  })

  it.each(['X-Skip-Toast', 'x-skip-toast'])('on 403: suppresses the toast when %s: "true" was sent', async (headerName) => {
    const error = makeError({
      response: { status: 403, data: {} } as any,
      config: makeConfig({ [headerName]: 'true' }),
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(toast.error).not.toHaveBeenCalled()
  })
})
