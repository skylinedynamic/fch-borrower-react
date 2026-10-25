import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { renderWithProviders, screen } from '../../test-utils'
import BorrowerActivitySidebar from '../../../src/components/Common/BorrowerActivitySidebar'

/**
 * BUG-103: a note the host or partner adds on the client's page with
 * visibility "Everyone" is about the client, not one application, so the
 * application's Activity panel never showed it. The panel now asks for the
 * client's notes too (include_client_notes); which ones the client may see
 * stays the server's call.
 */
afterEach(() => server.resetHandlers())

describe('Borrower application Activity panel', () => {
  it("asks for the client's own notes along with the application's entries, and shows them", async () => {
    let sent: Record<string, unknown> | null = null
    server.use(
      http.post('*/borrower/activity-logs/fetch-all-activities', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: true,
          message: 'ok',
          data: [
            { id: 2, event: 'Everyone note for the client', description: 'Everyone note for the client', created_at: '2026-10-19T19:55:00Z' },
            { id: 1, event: 'Funding Application Submitted', description: 'Funding Application Submitted', created_at: '2026-10-18T10:00:00Z' },
          ],
        })
      })
    )

    renderWithProviders(<BorrowerActivitySidebar funding_application_id={80} />)

    expect(await screen.findByText('Everyone note for the client')).toBeInTheDocument()
    expect(sent).toMatchObject({ funding_application_id: 80, include_client_notes: true })
  })
})
