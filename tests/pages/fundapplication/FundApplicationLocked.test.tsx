import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test-utils'
import FundApplication from '../../../src/pages/fundapplication/FundApplication'

/**
 * SCRUM-331: the edit form opened (by URL or bookmark) on an application whose
 * status isn't editable any more says why, instead of a form the API would
 * refuse to save (423).
 */
const request = vi.hoisted(() => ({ data: {} as Record<string, unknown> }))

vi.mock('../../../src/modules/funding-application/queries', async (original) => ({
  ...(await original<typeof import('../../../src/modules/funding-application/queries')>()),
  useFundingRequest: () => ({ data: request.data, isLoading: false }),
  useFundingApplicationDocuments: () => ({ data: undefined }),
}))

const reason = 'This application can no longer be edited because it is "Withdrawn". Contact your funding advisor if something needs to change.'

describe("FundApplication — Can't edit a locked application", () => {
  beforeEach(() => {
    request.data = { id: 9, status: 'Withdrawn', is_locked: true, is_editable: false, locked_reason: reason }
  })

  it('shows why instead of the form', async () => {
    renderWithProviders(<FundApplication />)

    expect(await screen.findByRole('heading', { name: /can't edit funding application/i })).toBeInTheDocument()
    expect(screen.getByText(reason)).toBeInTheDocument()
    expect(screen.queryByText(/^Step \d+ of/)).not.toBeInTheDocument()
  })

  it('names the status when the server sends no reason', async () => {
    request.data = { ...request.data, status: 'Closed - No Response', locked_reason: null }
    renderWithProviders(<FundApplication />)

    expect(await screen.findByText(/because it is "Closed - No Response"/)).toBeInTheDocument()
  })
})
