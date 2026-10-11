import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../../src/store/auth'
import { useBrandingStore } from '../../../src/store/brandingStore'
import { setAuth, clearAuth, isAuthenticated, checkSession, getToken, getUser } from '../../../src/lib/auth/auth'

const COOKIE_NAME = 'auth_session_active'

const clearAllCookies = () => {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    if (name) document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`
  })
}

const reset = () => {
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
  useBrandingStore.setState({ branding: null })
  localStorage.clear()
  clearAllCookies()
  document.title = 'Four Corner Funding'
}

describe('auth', () => {
  beforeEach(reset)
  afterEach(reset)

  describe('setAuth', () => {
    it('stores the token and user, and sets the session cookie', () => {
      setAuth('token-123', { id: 1, name: 'Jane' }, true)

      expect(getToken()).toBe('token-123')
      expect(getUser()).toEqual({ id: 1, name: 'Jane' })
      expect(document.cookie).toContain(`${COOKIE_NAME}=true`)
    })

    it('sets the session cookie even when rememberMe is false', () => {
      setAuth('token-123', { id: 1 }, false)
      expect(document.cookie).toContain(`${COOKIE_NAME}=true`)
    })

    it('erases the session cookie when called with no token', () => {
      setAuth('token-123', { id: 1 }, true)
      expect(document.cookie).toContain(COOKIE_NAME)

      setAuth(null, null)
      expect(document.cookie).not.toContain(`${COOKIE_NAME}=true`)
    })
  })

  describe('clearAuth', () => {
    it('clears the store token/user and erases the session cookie', () => {
      setAuth('token-123', { id: 1 }, true)

      clearAuth()

      expect(getToken()).toBe('')
      expect(getUser()).toBeNull()
      expect(document.cookie).not.toContain(`${COOKIE_NAME}=true`)
    })

    it('clears branding and resets the document title', async () => {
      useBrandingStore.getState().setBranding({
        site_name: 'White Label Co',
        site_slogan: null,
        primary_color: null,
        secondary_color: null,
        meta_title: null,
        header_logo: null,
        footer_logo: null,
        favicon: null,
        website_favicon: null,
        is_white_label: true,
      })
      document.title = 'White Label Co'

      clearAuth()

      await vi.waitFor(() => {
        expect(useBrandingStore.getState().branding).toBeNull()
        expect(document.title).toBe('Four Corner Funding')
      })
    })
  })

  describe('isAuthenticated', () => {
    it('is false with no token and true once a token is set', () => {
      expect(isAuthenticated()).toBe(false)
      setAuth('token-123', { id: 1 })
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('checkSession', () => {
    it('logs the user out when a token exists but the session cookie is missing', () => {
      setAuth('token-123', { id: 1 }, true)
      // Simulate the browser having closed and the session cookie expiring
      document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`

      checkSession()

      expect(getToken()).toBe('')
    })

    it('leaves the session intact when the token and cookie both exist', () => {
      setAuth('token-123', { id: 1 }, true)

      checkSession()

      expect(getToken()).toBe('token-123')
    })

    it('is a no-op when there is no token', () => {
      checkSession()
      expect(getToken()).toBe('')
    })
  })
})
