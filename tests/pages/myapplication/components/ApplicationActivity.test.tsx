import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../../test-utils'
import { server } from '../../../mocks/server'
import ApplicationActivity from '../../../../src/pages/myapplication/components/detail/ApplicationActivity'

/**
 * The Activity panel on Funding Application Details (redesign): a timeline
 * grouped by day, status changes as from → to, details on demand.
 */
const serve = (rows: object[]) =>
  server.use(http.post('*/borrower/activity-logs/fetch-all-activities', () => HttpResponse.json({ status: true, data: rows })))

const ACTIVITIES = [
  {
    id: 3, event_label: 'Funding Application Status Changed: Submitted (Received) → Underwriting Review', log_type_raw: 'funding_application_status_update',
    created_at: '2026-10-21T15:30:00Z', description: '<p>Moved to underwriting.</p>', causer_name: 'Host Admin',
  },
  { id: 2, event_label: 'Funding Application Submitted', log_type_raw: 'funding_application_submit', created_at: '2026-10-20T09:00:00Z', causer_name: 'Michael Chen' },
  { id: 1, event_label: 'Funding Application Generated', log_type_raw: 'funding_application_create', created_at: '2026-10-20T08:00:00Z' },
]

afterEach(() => server.resetHandlers())

describe('Application activity', () => {
  it('lists the activity as a timeline, grouped by day, with a count', async () => {
    serve(ACTIVITIES)
    renderWithProviders(<ApplicationActivity fundingApplicationId={8} />)

    const panel = await screen.findByRole('region', { name: /Activity/ })
    expect(await within(panel).findByText('Funding Application Submitted')).toBeInTheDocument()
    expect(within(panel).getByText('3')).toBeInTheDocument()
    expect(within(panel).getAllByRole('heading', { level: 6 }).map((h) => h.textContent)).toEqual(['Oct 21, 2026', 'Oct 20, 2026'])
  })

  it('shows a status change as from and to', async () => {
    serve(ACTIVITIES)
    renderWithProviders(<ApplicationActivity fundingApplicationId={8} />)

    const change = await screen.findByLabelText('Status changed from Submitted (Received) to Underwriting Review')
    expect(within(change).getByText('Submitted (Received)')).toBeInTheDocument()
    expect(within(change).getByText('Underwriting Review')).toBeInTheDocument()
  })

  it('shows who did it, and the details when asked', async () => {
    const user = userEvent.setup()
    serve(ACTIVITIES)
    renderWithProviders(<ApplicationActivity fundingApplicationId={8} />)

    expect(await screen.findByText('by Host Admin')).toBeInTheDocument()
    expect(screen.queryByText('Moved to underwriting.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show details' }))
    expect(screen.getByText('Moved to underwriting.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('says when there is no activity yet', async () => {
    serve([])
    renderWithProviders(<ApplicationActivity fundingApplicationId={8} />)

    expect(await screen.findByText('No activity yet')).toBeInTheDocument()
  })
})
