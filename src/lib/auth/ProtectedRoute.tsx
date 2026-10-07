import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted, isFreeTrialLocked } from './subscriptionUtils'
import { NOTIFICATIONS_ROUTE } from '../../config/notifications'


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

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }


  const isRestricted = isSubscriptionRestricted(userSubscription)

  if (isRestricted) {
    // Notifications stay open on every plan: the header bell is always shown.
    const allowedPaths = ['/dashboard', '/invoices', '/payments', NOTIFICATIONS_ROUTE]
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
