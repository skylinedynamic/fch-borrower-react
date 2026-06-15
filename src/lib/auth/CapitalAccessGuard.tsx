import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function CapitalAccessGuard() {
  const user = useAuthStore((state) => state.user)

  if (!user?.credit_profile_updated) {
    return <Navigate to="/capital-access" replace />
  }

  return <Outlet />
}
