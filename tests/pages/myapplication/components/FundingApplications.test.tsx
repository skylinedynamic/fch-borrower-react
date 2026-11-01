import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, within } from '../../../test-utils'
import { server } from '../../../mocks/server'
import FundingApplications from '../../../../src/pages/myapplication/components/FundingApplications'

afterEach(() => server.resetHandlers())

const mockList = (rows: any[]) =>
  server.use(
    http.post('*/borrower/myapplication/funding-application', () =>
      HttpResponse.json({ status: true, data: rows, meta: { total: rows.length, current_page: 1, last_page: 1, per_page: 10 } })
    )
  )

/**
 * Defect (BUG-027, CP-MYAPP-01): an application the borrower had started
 * (On Hold) was missing - "No funding applications found." while the funding
 * request said it had been started. The API now lists it; here it shows as On
 * Hold and offers to continue it from its funding request, not to view it as
 * if it had been submitted.
 */
describe('My Applications - Funding Applications', () => {
  // The list has no Action column: the row's title is its link (My Applications redesign).
  it('lists a started application as On Hold, its row continuing it from the funding request', async () => {
    mockList([
      { id: 9, status: 'On Hold', funding_request_id: 40, purpose_of_funds: 'Business Credit Building', preferred_funding_type: 'Line of Credit', date: '19 Oct 2026' },
      { id: 8, status: 'Closed (Completed)', funding_request_id: 31, purpose_of_funds: 'Working Capital', preferred_funding_type: 'Term Loan', date: '02 Oct 2026' },
    ])

    renderWithProviders(<FundingApplications />)

    const started = await screen.findByRole('row', { name: /Line of Credit/i })
    expect(within(started).getByText('On Hold')).toBeInTheDocument()
    expect(within(started).getByRole('link', { name: 'Line of Credit' })).toHaveAttribute('href', '/fund-application/40')

    const closed = screen.getByRole('row', { name: /Term Loan/i })
    expect(within(closed).getByRole('link', { name: 'Term Loan' })).toHaveAttribute('href', '/my-applications/funding/8')
    expect(screen.queryByRole('columnheader', { name: 'Action' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

/**
 * Defect (BUG-071): the Funding Type column showed the uses of funds
 * ("Expansion, Hiring, ...") instead of the funding type chosen (Term Loan).
 */
describe('My Applications - Funding Type column', () => {
  it('shows the preferred funding type, not the uses of funds', async () => {
    mockList([{ id: 7, status: 'Submitted', funding_request_id: 30, purpose_of_funds: 'Expansion, Hiring', preferred_funding_type: 'Term Loan', date: '01 Oct 2026' }])

    renderWithProviders(<FundingApplications />)

    const row = await screen.findByRole('row', { name: /Term Loan/i })
    expect(within(row).queryByText(/Expansion/)).not.toBeInTheDocument()
  })
})
