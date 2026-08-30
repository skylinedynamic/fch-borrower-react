import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import CapitalAccessLocked from '../../components/CapitalAccess/CapitalAccessLocked'

export default function CapitalAccessGuard() {
  const user = useAuthStore((state) => state.user)

  if (!user?.credit_profile_updated) {
    return <CapitalAccessLocked />
  }

  return <Outlet />
}
