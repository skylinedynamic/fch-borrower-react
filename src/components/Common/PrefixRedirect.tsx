import React from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

interface PrefixRedirectProps {
  /** Where the section lives now, e.g. "/credit-card-stacking". */
  to: string
}

/**
 * For a section that moved: mount on `<old>/*` and it redirects to the same
 * page under `to`, keeping the rest of the path and the query string, so old
 * bookmarks and emailed links keep working.
 */
export default function PrefixRedirect({ to }: PrefixRedirectProps) {
  const rest = useParams()['*']
  const { search, hash } = useLocation()
  return <Navigate to={`${to}${rest ? `/${rest}` : ''}${search}${hash}`} replace />
}
