import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { getToken, clearAuth } from '../auth'
import { MAINTENANCE_HTTP_STATUS } from '../../config/maintenance'
import { isMaintenanceResponse, reloadForMaintenance } from './maintenance'

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach Authorization header if token exists
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  config.headers = config.headers || {}
  
  if (token) {
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  
  if (typeof window !== 'undefined') {
    ;(config.headers as Record<string, string>)['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  
  return config
})

// Calls that must not start a refresh check: the check's own calls (they would
// recurse) and the auth calls (no session yet, or ending it).
const REFRESH_CHECK_EXCLUDED_PATHS = [
  '/borrower/user-details',
  '/common/refresh-user',
  '/auth/',
]

let refreshCheckInFlight = false

// The API flags a user with is_refresh when something about them changed - the
// host required or waived their agreement, say. After each call, look at
// user-details; getUserDetails() reloads the user (refresh-user) when flagged.
// Calls made together share one check.
function triggerUserRefreshCheck(url?: string) {
  if (!url || refreshCheckInFlight) return
  if (REFRESH_CHECK_EXCLUDED_PATHS.some((path) => url.includes(path))) return
  if (!getToken()) return

  refreshCheckInFlight = true
  import('../auth/authApi')
    .then(({ getUserDetails }) => getUserDetails())
    .catch(() => {})
    .finally(() => {
      refreshCheckInFlight = false
    })
}

// Global 401/403 handling: 401 => logout + redirect; 403 => toast only
apiClient.interceptors.response.use(
  (response) => {
    triggerUserRefreshCheck(response.config?.url)
    return response
  },
  (error: AxiosError) => {
    const status = error?.response?.status

    // Maintenance mode: the whole platform is down on purpose. Reload onto the
    // server's maintenance page; no error toast, no logout.
    if (status === MAINTENANCE_HTTP_STATUS && isMaintenanceResponse(error.response?.data)) {
      reloadForMaintenance((error.response?.data as { message?: string })?.message)
      return Promise.reject(error)
    }

    const skipToast = error.config?.headers?.['X-Skip-Toast'] === 'true' || error.config?.headers?.['x-skip-toast'] === 'true'

    // Toast for network connectivity issues (no response or network error).
    // A caller that recovers or reports the failure itself sets X-Skip-Toast.
    if (!skipToast && (!error.response || (error.code && error.code === 'ERR_NETWORK'))) {
      if (typeof window !== 'undefined') {
        const offline = typeof navigator !== 'undefined' && !navigator.onLine
        const message = offline
          ? 'You appear to be offline. Please reconnect and try again.'
          : 'Network error: Unable to reach the server. Please try again later.'
        toast.error(message, { toastId: 'network-error' })
      }
    }

    if (status === 401) {
      // Unauthorized: clear auth and redirect to login
      clearAuth()
      if (typeof window !== 'undefined') {
        const current = window.location.pathname
        if (current !== '/login') {
          window.location.assign('/login')
        }
      }
    } else if (status === 403) {
      // Forbidden: keep auth, show informative toast, do not redirect
      if (!skipToast) {
        const serverMessage = (error.response?.data as any)?.message
        const message = serverMessage || 'You do not have permission to perform this action.'
        toast.error(message, { toastId: 'forbidden-error' })
      }
    }
    return Promise.reject(error)
  }
)