import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted } from './subscriptionUtils'

export default function ProtectedRoute() {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const isRestricted = isSubscriptionRestricted(user)

  if (isRestricted) {
    const allowedPaths = ['/dashboard', '/invoices']
    const isAllowed = location.pathname === '/' || allowedPaths.some(path => location.pathname.startsWith(path))
    
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
