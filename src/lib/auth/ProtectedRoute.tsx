import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted } from './subscriptionUtils'

export default function ProtectedRoute() {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const userSubscription = useAuthStore((state) => state.userSubscription)

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const isRestricted = isSubscriptionRestricted(userSubscription)

  if (isRestricted) {
    const allowedPaths = ['/dashboard', '/invoices', '/payments']
    const isAllowed = location.pathname === '/' || allowedPaths.some(path => location.pathname.startsWith(path))
    
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
