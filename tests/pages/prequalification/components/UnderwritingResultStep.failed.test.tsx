import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../mocks/server'
import { renderWithProviders, screen } from '../../../test-utils'
import UnderwritingResultStep from '../../../../src/pages/prequalification/components/UnderwritingResultStep'

/**
 * BUG-060: after the automated review had already failed on the server, the
 * borrower kept seeing "Evaluating" for about a minute. The result step shows
 * the failure as soon as the API reports it - nothing holds the dialog open.
 */
const pending = { id: 155, gpt_status: 'PENDING', status: 'Pending', underwriting_result: null }
const failed = { ...pending, gpt_status: 'FAILED', gpt_generated_at: '2026-10-25 10:00:00' }

const serve = (data: Record<string, unknown>) =>
  server.use(
    http.get('*/borrower/pre-qualification/155', () => HttpResponse.json({ status: true, message: 'ok', data }))
  )

afterEach(() => server.resetHandlers())

describe('Underwriting result - a failed automated review', () => {
  it('shows "could not complete" with Try again as soon as the API says FAILED', async () => {
    serve(failed)
    renderWithProviders(<UnderwritingResultStep preQualId={155} initialData={failed} />)

    expect(await screen.findByText('We could not complete the automated review')).toBeInTheDocument()
    // The Evaluating modal stays mounted but closed (hidden from the accessibility tree).
    expect(screen.queryByRole('dialog', { name: 'Evaluating Underwriting Result' })).not.toBeInTheDocument()
  })

  it('swaps "Evaluating" for the failure on the first check that sees FAILED', async () => {
    // Submit handed over a still-running review; the server has failed it since.
    serve(failed)
    renderWithProviders(<UnderwritingResultStep preQualId={155} initialData={pending} />)

    // The step loads the record straight away rather than waiting out a timer.
    expect(await screen.findByText('We could not complete the automated review')).toBeInTheDocument()
    // The Evaluating modal stays mounted but closed (hidden from the accessibility tree).
    expect(screen.queryByRole('dialog', { name: 'Evaluating Underwriting Result' })).not.toBeInTheDocument()
  })
})
