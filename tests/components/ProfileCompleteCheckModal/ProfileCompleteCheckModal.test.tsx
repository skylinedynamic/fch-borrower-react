import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import { signInBorrower, signOutBorrower } from '../../mocks/onboarding'
import ProfileCompleteCheckModal from '../../../src/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal'

const section = (missing: string[]) => ({ is_complete: missing.length === 0, missing_fields: missing })

function serveCompletion(personal: string[], business: string[], financial: string[]) {
  server.use(
    http.get('*/borrower/profile/completion', () =>
      HttpResponse.json({
        status: true,
        data: {
          is_complete: personal.length + business.length + financial.length === 0,
          personal: section(personal),
          business: section(business),
          financial: section(financial),
          onboarding: { current_step: null, completed_steps: 0, total_steps: 4 },
        },
      })
    )
  )
}

function renderModal() {
  return renderWithProviders(
    <>
      <ProfileCompleteCheckModal />
      <Routes>
        <Route path="/" element={<div>Dashboard page</div>} />
        <Route path="/profile" element={<div>Profile page</div>} />
      </Routes>
    </>
  )
}

afterEach(signOutBorrower)

describe('ProfileCompleteCheckModal', () => {
  it('lists only the sections still to finish, with what is missing', async () => {
    signInBorrower()
    serveCompletion([], ['business_name', 'business_ein', 'business_address', 'entity_type'], ['monthly_revenue'])
    renderModal()

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/your profile needs attention/i)
    expect(dialog).toHaveTextContent(/complete the sections below to unlock your dashboard and all features/i)

    // Personal Information is done, so it isn't shown at all.
    expect(within(dialog).queryByRole('button', { name: /personal information/i })).toBeNull()

    // The first three missing fields by name, then how many more.
    const business = within(dialog).getByRole('button', { name: /business details/i })
    expect(business).toHaveTextContent(/4 fields/i)
    expect(business).toHaveTextContent(/business name/i)
    expect(business).toHaveTextContent('Business EIN')
    expect(business).toHaveTextContent(/business address/i)
    expect(business).not.toHaveTextContent(/entity type/i)
    expect(business).toHaveTextContent(/\+1 more field(?!s)/i)

    expect(within(dialog).getByRole('button', { name: /financial/i })).toHaveTextContent(/1 field/i)
  })

  it('points at the first section to complete with "Start here"', async () => {
    signInBorrower()
    serveCompletion([], ['entity_type'], ['monthly_revenue'])
    renderModal()

    const dialog = await screen.findByRole('dialog')
    const first = within(dialog).getByRole('button', { name: /business details/i })
    expect(first).toHaveTextContent(/start here/i)
    expect(first).toHaveClass('is-next')
    expect(within(dialog).getByRole('button', { name: /financial/i })).not.toHaveTextContent(/start here/i)
  })

  it('opens the profile on the section that was clicked', async () => {
    const user = userEvent.setup()
    signInBorrower()
    serveCompletion([], ['entity_type'], [])
    renderModal()

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /business details/i }))

    expect(await screen.findByText('Profile page')).toBeInTheDocument()
  })

  it('stays away once the profile is complete', async () => {
    signInBorrower()
    serveCompletion([], [], [])
    renderModal()

    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
