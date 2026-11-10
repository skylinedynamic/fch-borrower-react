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

/**
 * BUG-103 (from the old BorrowerActivitySidebar, which this panel replaced): a
 * note the host or partner adds on the client's page with visibility
 * "Everyone" is about the client, not one application, so the application's
 * Activity panel never showed it. The panel asks for the client's notes too
 * (include_client_notes); which ones the client may see stays the server's call.
 */
describe('Application activity - client notes', () => {
  it("asks for the client's own notes along with the application's entries, and shows them", async () => {
    let sent: Record<string, unknown> | null = null
    server.use(
      http.post('*/borrower/activity-logs/fetch-all-activities', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: true,
          data: [{ id: 9, event_label: 'Everyone note for the client', created_at: '2026-10-19T19:55:00Z' }],
        })
      })
    )

    renderWithProviders(<ApplicationActivity fundingApplicationId={80} />)

    expect(await screen.findByText('Everyone note for the client')).toBeInTheDocument()
    expect(sent).toMatchObject({ funding_application_id: 80, include_client_notes: true })
  })
})

/**
 * Defect (BUG-156, OP-CLI-28): a staff note with visibility "Everyone" reached
 * the client only as "Activity Created" - the panel titled it by event_label
 * and never showed its Summary (sent as `subject`), so a summary-only note
 * showed nothing at all. The Summary is the note's title; the message stays
 * under Show details.
 */
describe('Application activity - staff notes (BUG-156)', () => {
  const NOTE = { log_type_raw: 'activity', event_label: 'Activity Created', causer_name: 'Host Admin' }

  it("titles a summary-only note by its Summary, with no empty details", async () => {
    serve([{ ...NOTE, id: 11, subject: 'QA-TEST Run2 vis Everyone', description: null, created_at: '2026-11-01T20:14:00Z' }])
    renderWithProviders(<ApplicationActivity fundingApplicationId={102} />)

    expect(await screen.findByText('QA-TEST Run2 vis Everyone')).toBeInTheDocument()
    expect(screen.queryByText('Activity Created')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show details' })).not.toBeInTheDocument()
  })

  it('shows the Summary as the title and the message under Show details', async () => {
    const user = userEvent.setup()
    serve([{ ...NOTE, id: 12, subject: 'QA-TEST Run2 vis Everyone2 summary', description: 'QA-TEST Run2 message body for the client', created_at: '2026-11-01T20:18:00Z' }])
    renderWithProviders(<ApplicationActivity fundingApplicationId={102} />)

    expect(await screen.findByText('QA-TEST Run2 vis Everyone2 summary')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show details' }))
    expect(screen.getByText('QA-TEST Run2 message body for the client')).toBeInTheDocument()
  })

  it('keeps the event label for an entry that is not a note, even with a subject', async () => {
    serve([{ id: 13, log_type_raw: 'email', event_label: 'Email Sent', subject: 'Your documents', created_at: '2026-11-01T20:20:00Z' }])
    renderWithProviders(<ApplicationActivity fundingApplicationId={102} />)

    expect(await screen.findByText('Email Sent')).toBeInTheDocument()
  })
})

// BUG-004 (QA round 2): descriptions are HTML from the API, written with names
// people typed; a name like `<img src=x onerror=...>` ran in the admin's panel.
describe('Application activity - details cannot run script (BUG-004)', () => {
  it('shows the details with their formatting, without the onerror handler', async () => {
    const user = userEvent.setup()
    serve([{ ...ACTIVITIES[0], description: '<p><b>Moved</b> for R2-XSS <img src=x onerror="window.__xss = 1"></p>' }])
    const view = renderWithProviders(<ApplicationActivity fundingApplicationId={8} />)

    await user.click(await screen.findByRole('button', { name: 'Show details' }))
    expect(screen.getByText('Moved').tagName).toBe('B')
    expect(view.container.querySelector('[onerror]')).toBeNull()
  })
})
