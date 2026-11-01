import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import FundingGuard from '../../../src/lib/auth/FundingGuard'

const reset = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

const renderAt = (route: string) =>
  renderWithProviders(
    <Routes>
      <Route element={<FundingGuard />}>
        <Route path="/funding" element={<div>Funding programs</div>} />
        <Route path="/funding/:id" element={<div>Funding program detail</div>} />
        <Route path="/funding/:id/review" element={<div>Funding request review</div>} />
      </Route>
    </Routes>,
    { route }
  )

/** The profile completion endpoint, saying whether Funding is open (the API decides). */
const mockFundingAccess = (funding: { unlocked: boolean; credit_profile_submitted: boolean } | undefined) =>
  server.use(
    http.get('*/borrower/profile/completion', () =>
      HttpResponse.json({
        status: true,
        data: {
          is_complete: true,
          personal: { is_complete: true, missing_fields: [] },
          business: { is_complete: true, missing_fields: [] },
          financial: { is_complete: true, missing_fields: [] },
          ...(funding ? { funding } : {}),
        },
      })
    )
  )

/**
 * Funding waits for FCH to upload the borrower's credit report: without it
 * every funding criterion reads "Failed", so the pages stay closed.
 */
describe('FundingGuard', () => {
  beforeEach(() => {
    reset()
    useAuthStore.setState({ user: { id: 1 } } as never)
  })
  afterEach(() => {
    reset()
    server.resetHandlers()
  })

  it.each(['/funding', '/funding/7', '/funding/7/review'])('keeps %s closed until the credit report is uploaded', async (route) => {
    mockFundingAccess({ unlocked: false, credit_profile_submitted: true })
    renderAt(route)

    expect(await screen.findByRole('heading', { name: /funding opens once your credit report is uploaded/i })).toBeInTheDocument()
    expect(screen.queryByText('Funding programs')).toBeNull()
    expect(screen.queryByText('Funding program detail')).toBeNull()
    expect(screen.queryByText('Funding request review')).toBeNull()
  })

  it('opens Funding once the credit report is uploaded', async () => {
    mockFundingAccess({ unlocked: true, credit_profile_submitted: true })
    renderAt('/funding')

    expect(await screen.findByText('Funding programs')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /funding opens/i })).toBeNull()
  })

  it('stays closed when the API does not say Funding is open', async () => {
    mockFundingAccess(undefined)
    renderAt('/funding')

    expect(await screen.findByRole('heading', { name: /funding opens once your credit report is uploaded/i })).toBeInTheDocument()
    expect(screen.queryByText('Funding programs')).toBeNull()
  })
})
