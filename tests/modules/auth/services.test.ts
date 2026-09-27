import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import { login, logout, forgotPassword, resetPassword, fetchThemeConfigurations } from '../../../src/modules/auth/services'

const resetStore = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

beforeEach(resetStore)
afterEach(() => {
  server.resetHandlers()
  resetStore()
})

describe('login', () => {
  it('stores the token/user and subscription snapshot on success', async () => {
    const user = {
      id: 1,
      name: 'Jane Borrower',
      enrollment_type: 'self-guided',
      subscription_status: 'Active',
      is_free_trail: false,
    }
    server.use(
      http.post('*/borrower/login', () =>
        HttpResponse.json({ status: true, data: { token: 'tok_123', user } })
      )
    )

    const result = await login('jane@example.com', 'password', true)

    expect(result).toEqual({ token: 'tok_123', user })
    expect(useAuthStore.getState().token).toBe('tok_123')
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().userSubscription?.subscription_status).toBe('Active')
  })

  it('throws with the server message when status is false', async () => {
    server.use(
      http.post('*/borrower/login', () =>
        HttpResponse.json({ status: false, message: 'Invalid credentials' })
      )
    )

    await expect(login('jane@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    expect(useAuthStore.getState().token).toBeUndefined()
  })

  it('throws when the success response is missing a token or user', async () => {
    server.use(
      http.post('*/borrower/login', () => HttpResponse.json({ status: true, data: {} }))
    )

    await expect(login('jane@example.com', 'password')).rejects.toThrow('Login response missing token or user')
  })
})

describe('logout', () => {
  it('returns the server response', async () => {
    server.use(http.post('*/borrower/logout', () => HttpResponse.json({ status: true, message: 'Logged out' })))
    await expect(logout()).resolves.toEqual({ status: true, message: 'Logged out' })
  })
})

describe('forgotPassword / resetPassword', () => {
  it('forgotPassword resolves on success and rejects with the server message on failure', async () => {
    server.use(http.post('*/auth/forgot', () => HttpResponse.json({ status: true, message: 'Email sent' })))
    await expect(forgotPassword('jane@example.com')).resolves.toEqual({ status: true, message: 'Email sent' })

    server.use(http.post('*/auth/forgot', () => HttpResponse.json({ status: false, message: 'No account found' })))
    await expect(forgotPassword('missing@example.com')).rejects.toThrow('No account found')
  })

  it('resetPassword resolves on success and rejects on failure', async () => {
    const payload = { token: 't', email: 'jane@example.com', password: 'newpass', password_confirmation: 'newpass' }
    server.use(http.post('*/auth/reset', () => HttpResponse.json({ status: true, message: 'Password reset' })))
    await expect(resetPassword(payload)).resolves.toEqual({ status: true, message: 'Password reset' })

    server.use(http.post('*/auth/reset', () => HttpResponse.json({ status: false, message: 'Token expired' })))
    await expect(resetPassword(payload)).rejects.toThrow('Token expired')
  })
})

describe('fetchThemeConfigurations', () => {
  it('returns the theme data on success', async () => {
    server.use(
      http.get('*/common/get-theme', () => HttpResponse.json({ status: true, data: { primary_color: '#000' } }))
    )
    await expect(fetchThemeConfigurations()).resolves.toEqual({ primary_color: '#000' })
  })

  it('returns null on failure instead of throwing', async () => {
    server.use(http.get('*/common/get-theme', () => HttpResponse.json({ status: false })))
    await expect(fetchThemeConfigurations()).resolves.toBeNull()

    server.use(http.get('*/common/get-theme', () => HttpResponse.error()))
    await expect(fetchThemeConfigurations()).resolves.toBeNull()
  })
})
