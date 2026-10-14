import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, within } from '@testing-library/react'

import Sidebar from '../../../src/components/Layout/Sidebar'
import { useAuthStore } from '../../../src/store/auth'
import { useBrandingStore } from '../../../src/store/brandingStore'
import { DEFAULT_BRAND_LOGO } from '../../../src/utils/brandLogo'
import { renderWithProviders } from '../../test-utils'

vi.mock('../../../src/modules/dashboard', () => ({
  useDashboard: () => ({ data: null, isLoading: false }),
}))

const TENANT_LOGO = 'http://127.0.0.1:8000/storage/partners/9/missing-logo.png'

function brand(branding: Record<string, unknown>) {
  useBrandingStore.setState({ branding } as never)
}

/**
 * E2E-006: a tenant logo URL that fails to load (deleted file, 403, CDN down)
 * left the sidebar brand box empty. The fallback is the tenant's own name -
 * never the packaged host logo, which brandLogo.ts forbids on a white-label
 * portal.
 */
describe('Sidebar brand logo', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 1, name: 'Michael Chen' }, userSubscription: null } as never)
    brand({ logo_sidebar_full_url: TENANT_LOGO, site_name: 'Acme Capital' })
  })

  it('shows the tenant logo while it loads fine', () => {
    const { container } = renderWithProviders(<Sidebar />)
    const logos = container.querySelectorAll('.navbar-brand-box .logo-lg img')
    expect(logos.length).toBeGreaterThan(0)
    logos.forEach((img) => expect(img.getAttribute('src')).toBe(TENANT_LOGO))
  })

  it('falls back to the tenant name, not the host logo, when the image fails', () => {
    const { container } = renderWithProviders(<Sidebar />)

    container.querySelectorAll('.navbar-brand-box img').forEach((img) => fireEvent.error(img))

    const box = container.querySelector('.navbar-brand-box') as HTMLElement
    expect(within(box).getAllByText('Acme Capital').length).toBeGreaterThan(0)
    expect(box.querySelector(`img[src="${TENANT_LOGO}"]`)).toBeNull()
    expect(box.querySelector(`img[src="${DEFAULT_BRAND_LOGO}"]`)).toBeNull()
  })

  it('tries the image again when branding hands it a new URL', () => {
    const { container, rerender } = renderWithProviders(<Sidebar />)
    container.querySelectorAll('.navbar-brand-box img').forEach((img) => fireEvent.error(img))

    brand({ logo_sidebar_full_url: 'http://127.0.0.1:8000/storage/partners/9/new-logo.png', site_name: 'Acme Capital' })
    rerender(<Sidebar />)

    expect(container.querySelector('.navbar-brand-box img[src$="new-logo.png"]')).toBeTruthy()
  })
})

/**
 * E2E-008: the sidebar user dropdown still carried the theme's demo content
 * ("Welcome Anna!", a fake balance, links to "#").
 */
describe('Sidebar user dropdown', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 1, name: 'Michael Chen' }, userSubscription: null } as never)
    brand({})
  })

  it('greets the signed-in user and has no demo content', () => {
    const { container } = renderWithProviders(<Sidebar />)
    const menu = container.querySelector('.sidebar-user .dropdown-menu') as HTMLElement

    expect(within(menu).getByText('Welcome Michael Chen!')).toBeInTheDocument()
    expect(menu.textContent).not.toMatch(/Anna|Balance|\$5971/)
    expect(menu.querySelectorAll('a[href="#"]')).toHaveLength(0)
  })

  it('links to real pages', () => {
    const { container } = renderWithProviders(<Sidebar />)
    const menu = container.querySelector('.sidebar-user .dropdown-menu') as HTMLElement

    expect(within(menu).getByRole('link', { name: /Profile/ })).toHaveAttribute('href', '/profile')
    expect(within(menu).getByRole('link', { name: /Change Password/ })).toHaveAttribute('href', '/change-password')
    expect(within(menu).getByRole('button', { name: /Logout/ })).toBeInTheDocument()
  })
})

