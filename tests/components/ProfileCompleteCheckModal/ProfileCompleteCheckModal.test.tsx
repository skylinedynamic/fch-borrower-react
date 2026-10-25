import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { server } from '../../mocks/server'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { useAuthStore } from '../../../src/store/auth'
import ProfileCompleteCheckModal from '../../../src/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal'

/**
 * The Complete Your Profile popup a borrower with gaps in their profile gets on
 * every page but Profile. It can't be dismissed: the way out is to pick a
 * section to complete.
 */
const incomplete = () =>
  server.use(
    http.get('*/borrower/profile/completion', () =>
      HttpResponse.json({
        status: true,
        data: {
          is_complete: false,
          personal: { is_complete: true, missing_fields: [] },
          business: { is_complete: false, missing_fields: ['business_email', 'business_country'] },
          financial: { is_complete: true, missing_fields: [] },
        },
      })
    )
  )

const renderAt = (route: string) =>
  renderWithProviders(
    <Routes>
      <Route path="*" element={<ProfileCompleteCheckModal />} />
    </Routes>,
    { route }
  )

const dialog = () => screen.findByRole('dialog')

describe('ProfileCompleteCheckModal', () => {
  afterEach(() => {
    useAuthStore.setState({ token: undefined, user: null, userSubscription: null } as never)
  })

  const signIn = () =>
    useAuthStore.setState({ token: 't', user: { id: 1 }, userSubscription: null } as never)

  it('opens for an incomplete profile, naming the section to finish', async () => {
    signIn()
    incomplete()
    renderAt('/payments')

    expect(await dialog()).toHaveTextContent('Complete Your Profile')
    expect(await dialog()).toHaveTextContent('Business Details')
  })

  it('has no close or cancel button', async () => {
    signIn()
    incomplete()
    renderAt('/payments')

    const modal = await dialog()
    expect(modal.querySelector('.btn-close')).toBeNull()
    expect(screen.queryByRole('button', { name: /close|cancel/i })).toBeNull()
  })

  it('stays open on Escape', async () => {
    signIn()
    incomplete()
    const user = userEvent.setup()
    renderAt('/payments')
    await dialog()

    await user.keyboard('{Escape}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes by going to the section chosen', async () => {
    signIn()
    incomplete()
    const user = userEvent.setup()
    renderAt('/payments')

    await user.click(await screen.findByText('Business Details'))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
