import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function HostRoute() {
    const user = useAuthStore((state) => state.user)

    if (!user?.is_host) {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}
