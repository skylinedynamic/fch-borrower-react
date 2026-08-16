import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AuthUser = {
  id?: string | number
  name?: string
  email?: string
  role?: string
  image?: string
  permissions?: string[]
  entity_type?: string
  entity_id?: string | number
  is_host?: number
  current_tier?: number | null
  subscription_status?: string
  subscription_end_date?: string | null
  subscription_start_date?: string | null
  credit_profile_updated?: boolean
  enrollment_type?: string
  phase?: string
  is_free_trail?: boolean
  free_trail_end_date?: string | null
  [key: string]: unknown
}

export type UserSubscription = {
  enrollment_type?: string
  subscription_status?: string
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  partner_type?: string | null
  partner_invoice_status?: string | null
  partner_payment_for_me?: boolean
  is_free_trail?: boolean
  free_trail_end_date?: string | null
  [key: string]: unknown
}

type AuthState = {
  token?: string
  user?: AuthUser | null
  userSubscription?: UserSubscription | null
  rememberMe?: boolean
  setCredentials: (payload: { token?: string; user?: AuthUser | null; rememberMe?: boolean }) => void
  setUserData: (user: AuthUser | null) => void
  setUserSubscription: (subscription: UserSubscription | null) => void
  clearCredentials: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: undefined,
      user: null,
      userSubscription: null,
      rememberMe: true,
      setCredentials: ({ token, user, rememberMe }) => set(() => ({ token, user, rememberMe })),
      setUserData: (user) => set(() => ({ user })),
      setUserSubscription: (subscription) => set(() => ({ userSubscription: subscription })),
      clearCredentials: () => set(() => ({ token: undefined, user: null, userSubscription: null })),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
      // Always persist token and user, regardless of rememberMe
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        userSubscription: state.userSubscription,
        rememberMe: state.rememberMe
      }),
    }
  )
)

// Non-hook helpers for library code (axios interceptors, guards, etc.)
export const getAuthState = () => {
  const { token, user, rememberMe, userSubscription } = useAuthStore.getState()
  return { token, user, rememberMe, userSubscription }
}

export const setAuthState = (payload: { token?: string; user?: AuthUser | null; rememberMe?: boolean }) => {
  useAuthStore.getState().setCredentials(payload)
}

export const setUserDataState = (user: AuthUser | null) => {
  useAuthStore.getState().setUserData(user)
}

export const setUserSubscriptionState = (subscription: UserSubscription | null) => {
  useAuthStore.getState().setUserSubscription(subscription)
}

export const getUserSubscriptionState = () => {
  const { userSubscription } = useAuthStore.getState()
  return userSubscription
}

export const clearAuthState = () => {
  useAuthStore.getState().clearCredentials()
}