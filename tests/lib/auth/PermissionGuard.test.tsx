import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '../../../src/store/auth'
import PermissionGuard from '../../../src/lib/auth/PermissionGuard'

const reset = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

describe('PermissionGuard', () => {
  beforeEach(reset)
  afterEach(reset)

  it('renders children when no constraints are given', () => {
    render(<PermissionGuard>Visible</PermissionGuard>)
    expect(screen.getByText('Visible')).toBeInTheDocument()
  })

  it('renders children when the user has any of the required permissions', () => {
    useAuthStore.setState({ user: { permissions: ['view-invoices'] } })
    render(<PermissionGuard any={['edit-profile', 'view-invoices']}>Visible</PermissionGuard>)
    expect(screen.getByText('Visible')).toBeInTheDocument()
  })

  it('renders the fallback when the user has none of the required permissions', () => {
    useAuthStore.setState({ user: { permissions: [] } })
    render(<PermissionGuard any={['edit-profile']} fallback={<span>Locked</span>}>Visible</PermissionGuard>)
    expect(screen.queryByText('Visible')).not.toBeInTheDocument()
    expect(screen.getByText('Locked')).toBeInTheDocument()
  })

  it('requires every "all" permission to be present', () => {
    useAuthStore.setState({ user: { permissions: ['view-invoices'] } })
    render(<PermissionGuard all={['view-invoices', 'edit-profile']} fallback={<span>Locked</span>}>Visible</PermissionGuard>)
    expect(screen.getByText('Locked')).toBeInTheDocument()
  })

  it('checks role membership', () => {
    useAuthStore.setState({ user: { role: 'borrower' } })
    render(<PermissionGuard role={['admin', 'borrower']}>Visible</PermissionGuard>)
    expect(screen.getByText('Visible')).toBeInTheDocument()
  })

  it('renders nothing (no fallback) by default when denied', () => {
    useAuthStore.setState({ user: { role: 'borrower' } })
    const { container } = render(<PermissionGuard role="admin">Visible</PermissionGuard>)
    expect(container).toBeEmptyDOMElement()
  })
})
