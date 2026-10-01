import { beforeEach, describe, expect, it, vi } from 'vitest'

import Sidebar from '../../../src/components/Layout/Sidebar'
import { useAuthStore } from '../../../src/store/auth'
import { renderWithProviders } from '../../test-utils'

vi.mock('../../../src/modules/dashboard', () => ({
  useDashboard: () => ({ data: null, isLoading: false }),
}))

/**
 * Where the free-plan banner sits in the sidebar.
 *
 * It was absolutely positioned over the menu, so on a laptop-height screen - the
 * menu long enough to fill the column - it covered the last item, which is
 * Profile. The banner now takes part in the sidebar's layout instead of floating
 * above it, and `has-trial-panel` on the sidebar root is what switches that
 * layout on, so the stylesheet only takes the menu over when there is a banner
 * to make room for.
 *
 * jsdom has no layout engine, so overlap itself cannot be asserted here. What is
 * asserted is the structure the CSS depends on: the marker class, and the banner
 * being a sibling that follows the scroll area rather than living inside it.
 */
function signIn(subscription: Record<string, unknown> | null) {
  useAuthStore.setState({
    user: { id: 1, name: 'Odessa Mccall' },
    userSubscription: subscription,
  } as never)
}

describe('Sidebar free-plan banner', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, userSubscription: null } as never)
  })

  it('marks the sidebar when a free plan banner is shown', () => {
    signIn({ is_free_trail: true })

    const { container } = renderWithProviders(<Sidebar />)

    const menu = container.querySelector('.navbar-menu')
    expect(menu).toBeTruthy()
    expect(menu?.classList.contains('has-trial-panel')).toBe(true)
    expect(container.querySelector('.sidebar-trial-panel')).toBeTruthy()
  })

  it('leaves the menu alone for a paid plan', () => {
    // No banner means no reason to change how the menu is laid out.
    signIn({ is_free_trail: false })

    const { container } = renderWithProviders(<Sidebar />)

    const menu = container.querySelector('.navbar-menu')
    expect(menu?.classList.contains('has-trial-panel')).toBe(false)
    expect(container.querySelector('.sidebar-trial-panel')).toBeNull()
  })

  it('puts the banner after the scroll area, not inside it', () => {
    // The flex layout depends on this: the scroll area takes the free space and
    // the banner sits below it. Nested inside, it would scroll away with the menu.
    signIn({ is_free_trail: true })

    const { container } = renderWithProviders(<Sidebar />)

    const scroller = container.querySelector('#scrollbar')
    const panel = container.querySelector('.sidebar-trial-panel')

    expect(scroller).toBeTruthy()
    expect(panel).toBeTruthy()
    expect(scroller?.contains(panel as Node)).toBe(false)
    expect(panel?.previousElementSibling).toBe(scroller)
  })
})
