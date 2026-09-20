import { apiClient } from '../../lib/http/apiClient'
import { setAuth, AuthUser, setUserSubscription } from '../../lib/auth/auth'
import type { BorrowerRegistrationPayload } from './types'

export type LoginSuccess = { token: string; user: AuthUser }

export const registerBorrower = async (payload: BorrowerRegistrationPayload): Promise<any> => {
  const { data } = await apiClient.post('/borrower/register', payload)
  return data
}

export async function login(email: string, password: string, remember: boolean = true): Promise<LoginSuccess> {
  try {
    const res = await apiClient.post('/borrower/login', { email, password, remember })
    const data = res?.data

    if (data?.status === true) {
      const token: string | undefined = data?.data?.token
      const user: AuthUser | undefined = data?.data?.user
      if (!token || !user) {
        const error: any = new Error('Login response missing token or user')
        error.response = { data }
        throw error
      }
      setAuth(token, user, remember)

      setUserSubscription({
        enrollment_type: user.enrollment_type,
        subscription_status: user.subscription_status,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        is_free_trail: user.is_free_trail,
        free_trail_end_date: user.free_trail_end_date
      })

      return { token, user }
    }

    const error: any = new Error(data?.message ?? 'Login failed')
    error.response = { data }
    throw error
  } catch (err) {
    throw err
  }
}

export async function logout(): Promise<{ status?: boolean; message?: string; data?: any }> {
  try {
    const res = await apiClient.post('/borrower/logout')
    return res?.data ?? { status: true }
  } catch (err) {
    throw err
  }
}

export async function forgotPassword(email: string): Promise<any> {
  try {
    const res = await apiClient.post('/auth/forgot', { email })
    const data = res?.data
    if (data?.status === true) {
      return data
    }
    const error: any = new Error(data?.message ?? 'Unable to process request.')
    error.response = { data }
    throw error
  } catch (err) {
    throw err
  }
}

export async function resetPassword(payload: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<any> {
  try {
    const res = await apiClient.post('/auth/reset', payload)
    const data = res?.data
    if (data?.status === true) {
      return data
    }
    const error: any = new Error(data?.message ?? 'Unable to reset password.')
    error.response = { data }
    throw error
  } catch (err) {
    throw err
  }
}



export async function fetchThemeConfigurations(): Promise<any> {
  try {
    const res = await apiClient.get('/common/get-theme')
    if (res?.data?.status === true) {
      return res.data.data
    }
    return null
  } catch (err) {
    return null
  }
}

/**
 * Branding on its own, for screens that only need to paint the brand.
 *
 * get-theme also queries the email configuration and the payment providers to
 * build its freshness flags, and the brand had to wait behind both. This returns
 * just the branding - cached server-side - plus `css_vars`, the same precomputed
 * variable map /api/branding.css paints with, so the two cannot disagree.
 */
export async function fetchBranding(): Promise<{ branding: any; cssVars: Record<string, string> | null } | null> {
  try {
    const res = await apiClient.get('/common/branding')
    if (res?.data?.success === true) {
      return {
        branding: res.data.data?.branding ?? null,
        cssVars: res.data.data?.css_vars ?? null,
      }
    }
    return null
  } catch (err) {
    return null
  }
}
