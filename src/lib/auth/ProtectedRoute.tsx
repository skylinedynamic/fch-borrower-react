import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted, isFreeTrialLocked } from './subscriptionUtils'
import { clearAuth } from './auth'
import { logout } from '../../modules/auth/services'

function isTrialEndDateExpired(trialEndDate: string): boolean {
  if (!trialEndDate) return false
  const cleanDateStr = trialEndDate.split(' ')[0].split('T')[0]
  const [year, month, day] = cleanDateStr.split('-').map(Number)
  
  // Construct expiry date at local end-of-day (23:59:59.999) using local time constructor
  const localExpiryDate = new Date(year, month - 1, day, 23, 59, 59, 999)
  
  if (isNaN(localExpiryDate.getTime())) {
    const parsedDate = new Date(trialEndDate).getTime()
    return !isNaN(parsedDate) && Date.now() > parsedDate
  }
  
  return Date.now() > localExpiryDate.getTime()
}

// Paths that are blocked while on the Limited Free Edition (free trial)
const FREE_TRIAL_LOCKED_PATHS = [
  '/capital-access',
  '/invoices',
  '/payments',
  '/resources',
  '/credit-builder',
]

export default function ProtectedRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const userSubscription = useAuthStore((state) => state.userSubscription)

  const isFreeTrial = !!user?.is_free_trail || !!userSubscription?.is_free_trail
  const trialEndDate = (user?.free_trail_end_date || userSubscription?.free_trail_end_date) as string | undefined

  const isTrialExpired = !!trialEndDate && isTrialEndDateExpired(trialEndDate)

  useEffect(() => {
    if (token && isTrialExpired) {
      const performLogout = async () => {
        try {
          await logout()
        } catch (err) {
          console.error('Trial expiration logout failed', err)
        } finally {
          clearAuth()
          navigate('/login', { replace: true })
        }
      }
      performLogout()
    }
  }, [token, isTrialExpired, navigate])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isTrialExpired) {
    return null
  }

  const isRestricted = isSubscriptionRestricted(userSubscription)

  if (isRestricted) {
    const allowedPaths = ['/dashboard', '/invoices', '/payments']
    const isAllowed = location.pathname === '/' || allowedPaths.some(path => location.pathname.startsWith(path))
    
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  // Block free-trial users from accessing premium modules via direct URL
  if (isFreeTrialLocked(userSubscription)) {
    const isLockedPath = FREE_TRIAL_LOCKED_PATHS.some(path => location.pathname.startsWith(path))
    if (isLockedPath) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
