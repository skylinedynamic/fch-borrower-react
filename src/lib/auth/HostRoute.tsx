import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { PARTNER_TYPES } from '../../config/partnerTypeOptions'

export default function HostRoute() {
    const user = useAuthStore((state) => state.user)
    const isHostOrWL = !!user?.is_host || user?.partner_type === PARTNER_TYPES.WHITE_LABEL;

    if (!isHostOrWL) {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}
