import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../../src/store/auth'
import { getPermissions, getRole, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } from '../../../src/lib/auth/rbac'

const setUser = (user: Record<string, unknown> | null) => {
  useAuthStore.setState({ user: user as any })
}

const reset = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

describe('rbac', () => {
  beforeEach(reset)
  afterEach(reset)

  it('getPermissions returns the user\'s permissions array, filtering out non-strings', () => {
    setUser({ permissions: ['view-invoices', 'edit-profile', 42, null] })
    expect(getPermissions()).toEqual(['view-invoices', 'edit-profile'])
  })

  it('getPermissions returns an empty array when there is no user or no permissions field', () => {
    setUser(null)
    expect(getPermissions()).toEqual([])

    setUser({})
    expect(getPermissions()).toEqual([])
  })

  it('getRole returns the role string, or undefined when absent/non-string', () => {
    setUser({ role: 'borrower' })
    expect(getRole()).toBe('borrower')

    setUser({ role: 123 })
    expect(getRole()).toBeUndefined()

    setUser(null)
    expect(getRole()).toBeUndefined()
  })

  it('hasPermission checks membership in the permissions array', () => {
    setUser({ permissions: ['view-invoices'] })
    expect(hasPermission('view-invoices')).toBe(true)
    expect(hasPermission('delete-invoices')).toBe(false)
  })

  it('hasAnyPermission is true when at least one required permission is present', () => {
    setUser({ permissions: ['view-invoices'] })
    expect(hasAnyPermission(['delete-invoices', 'view-invoices'])).toBe(true)
    expect(hasAnyPermission(['delete-invoices', 'edit-profile'])).toBe(false)
  })

  it('hasAllPermissions requires every required permission to be present', () => {
    setUser({ permissions: ['view-invoices', 'edit-profile'] })
    expect(hasAllPermissions(['view-invoices', 'edit-profile'])).toBe(true)
    expect(hasAllPermissions(['view-invoices', 'delete-invoices'])).toBe(false)
  })

  it('hasRole matches a single role or membership in a role list', () => {
    setUser({ role: 'borrower' })
    expect(hasRole('borrower')).toBe(true)
    expect(hasRole('admin')).toBe(false)
    expect(hasRole(['admin', 'borrower'])).toBe(true)
    expect(hasRole(['admin', 'manager'])).toBe(false)
  })

  it('hasRole is false when there is no user', () => {
    setUser(null)
    expect(hasRole('borrower')).toBe(false)
  })
})
