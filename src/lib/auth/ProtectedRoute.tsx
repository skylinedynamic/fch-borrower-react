import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted, isFreeTrialLocked, RESTRICTION_REASON } from './subscriptionUtils'
import { RESTRICTED_ALLOWED_PATHS, FREE_PLAN_LOCKED_PATHS, isUnderPath } from '../../config/accessRestriction'

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
    const isAllowed = location.pathname === '/' || RESTRICTED_ALLOWED_PATHS.some(path => location.pathname.startsWith(path))
    
    if (!isAllowed) {
      // The sidebar reads restrictedFrom and explains why (BUG-033).
      return <Navigate to="/dashboard" replace state={{ restrictedFrom: location.pathname }} />
    }
  }

  // Block free-plan clients from the paid modules by direct URL. The sidebar
  // reads restrictedFrom and reason and says why (R3-BUG-036).
  if (isFreeTrialLocked(userSubscription) && isUnderPath(location.pathname, FREE_PLAN_LOCKED_PATHS)) {
    return <Navigate to="/dashboard" replace state={{ restrictedFrom: location.pathname, reason: RESTRICTION_REASON.FREE_PLAN }} />
  }

  return <Outlet />
}
