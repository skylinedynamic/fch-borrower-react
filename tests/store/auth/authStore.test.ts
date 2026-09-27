import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  useAuthStore,
  getAuthState,
  setAuthState,
  setUserDataState,
  setUserSubscriptionState,
  getUserSubscriptionState,
  clearAuthState,
} from '../../../src/store/auth/authStore'

const resetStore = () => {
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
  localStorage.clear()
}

describe('authStore', () => {
  beforeEach(resetStore)
  afterEach(resetStore)

  it('setCredentials sets token, user, and rememberMe', () => {
    const user = { id: 1, name: 'Jane Borrower', email: 'jane@example.com' }
    useAuthStore.getState().setCredentials({ token: 'abc123', user, rememberMe: false })

    const state = useAuthStore.getState()
    expect(state.token).toBe('abc123')
    expect(state.user).toEqual(user)
    expect(state.rememberMe).toBe(false)
  })

  it('setUserData updates only the user field', () => {
    useAuthStore.getState().setCredentials({ token: 'abc123', user: { id: 1 }, rememberMe: true })
    useAuthStore.getState().setUserData({ id: 2, name: 'Updated Name' })

    const state = useAuthStore.getState()
    expect(state.user).toEqual({ id: 2, name: 'Updated Name' })
    expect(state.token).toBe('abc123')
  })

  it('setUserSubscription updates only the subscription field', () => {
    useAuthStore.getState().setUserSubscription({ subscription_status: 'active' })
    expect(useAuthStore.getState().userSubscription).toEqual({ subscription_status: 'active' })
  })

  it('clearCredentials resets token, user, and subscription but leaves rememberMe untouched', () => {
    useAuthStore.getState().setCredentials({ token: 'abc123', user: { id: 1 }, rememberMe: false })
    useAuthStore.getState().setUserSubscription({ subscription_status: 'active' })

    useAuthStore.getState().clearCredentials()

    const state = useAuthStore.getState()
    expect(state.token).toBeUndefined()
    expect(state.user).toBeNull()
    expect(state.userSubscription).toBeNull()
    expect(state.rememberMe).toBe(false)
  })

  it('always persists token and user to localStorage regardless of rememberMe=false', () => {
    useAuthStore.getState().setCredentials({ token: 'abc123', user: { id: 1, name: 'Jane' }, rememberMe: false })

    const persisted = JSON.parse(localStorage.getItem('auth') || '{}')
    expect(persisted.state.token).toBe('abc123')
    expect(persisted.state.user).toEqual({ id: 1, name: 'Jane' })
    expect(persisted.state.rememberMe).toBe(false)
  })

  describe('non-hook helpers', () => {
    it('getAuthState mirrors the store state', () => {
      useAuthStore.getState().setCredentials({ token: 'xyz', user: { id: 5 }, rememberMe: true })
      expect(getAuthState()).toEqual({ token: 'xyz', user: { id: 5 }, rememberMe: true, userSubscription: null })
    })

    it('setAuthState writes credentials via the store', () => {
      setAuthState({ token: 'from-helper', user: { id: 9 }, rememberMe: true })
      expect(useAuthStore.getState().token).toBe('from-helper')
    })

    it('setUserDataState / setUserSubscriptionState / getUserSubscriptionState round-trip', () => {
      setUserDataState({ id: 3, name: 'Helper User' })
      expect(useAuthStore.getState().user).toEqual({ id: 3, name: 'Helper User' })

      setUserSubscriptionState({ subscription_status: 'trialing' })
      expect(getUserSubscriptionState()).toEqual({ subscription_status: 'trialing' })
    })

    it('clearAuthState clears credentials via the store', () => {
      setAuthState({ token: 'to-be-cleared', user: { id: 1 }, rememberMe: true })
      clearAuthState()

      const state = useAuthStore.getState()
      expect(state.token).toBeUndefined()
      expect(state.user).toBeNull()
    })
  })
})
