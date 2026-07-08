import React from 'react'
import { Outlet } from 'react-router-dom'

/**
 * Route-level guard that protects all /capital-access/:id/* sub-routes.
 * The access and cooling delay checks are now performed at the page level 
 * using the fresh page-specific queries (isAccessible and reason_code).
 */
export default function CapitalAccessStrategyGuard() {
  return <Outlet />
}

