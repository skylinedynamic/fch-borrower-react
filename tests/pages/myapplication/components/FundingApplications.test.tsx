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
      { id: 9, status: 'On Hold', funding_request_id: 40, purpose_of_funds: 'Business Credit Building', date: '19 Oct 2026' },
      { id: 8, status: 'Closed (Completed)', funding_request_id: 31, purpose_of_funds: 'Working Capital', date: '02 Oct 2026' },
    ])

    renderWithProviders(<FundingApplications />)

    const started = await screen.findByRole('row', { name: /Business Credit Building/i })
    expect(within(started).getByText('On Hold')).toBeInTheDocument()
    expect(within(started).getByRole('link', { name: 'Business Credit Building' })).toHaveAttribute('href', '/fund-application/40')

    const closed = screen.getByRole('row', { name: /Working Capital/i })
    expect(within(closed).getByRole('link', { name: 'Working Capital' })).toHaveAttribute('href', '/my-applications/funding/8')
    expect(screen.queryByRole('columnheader', { name: 'Action' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
