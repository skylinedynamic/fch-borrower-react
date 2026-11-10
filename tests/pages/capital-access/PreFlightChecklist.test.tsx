import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import PreFlightChecklist from '../../../src/pages/capital-access/PreFlightChecklist'

/**
 * BUG-043 (R2-CP-CAP-03): "Business Information - Missing" named no field, so
 * the borrower could not tell what to fill in. The item now lists the missing
 * profile fields and links to Profile > Business Details.
 */
const serve = (businessItem: Record<string, unknown>) =>
  server.use(
    http.get('*/borrower/capital-access/strategies/7/checklist', () =>
      HttpResponse.json({
        status: true,
        data: {
          id: 7,
          name: 'Foundation 100 Play',
          isAccessible: true,
          approval_status: true,
          reason_code: null,
          checklist: [
            { id: 'business_info', label: 'Business Information', ...businessItem },
            { id: 'ein_verified', label: 'EIN Verified', complete: true },
          ],
        },
      })
    )
  )

const open = () =>
  renderWithProviders(
    <Routes>
      <Route path="/credit-card-stacking/:id/pre-flight" element={<PreFlightChecklist />} />
    </Routes>,
    { route: '/credit-card-stacking/7/pre-flight' }
  )

afterEach(() => server.resetHandlers())

describe('Pre-Flight Checklist - Business Information', () => {
  it('names the missing fields and links to Profile > Business Details', async () => {
    serve({ complete: false, missing_fields: ['business_email', 'zip_code'] })
    open()

    const item = (await screen.findByText('Business Information')).closest('.ca-checklist-item') as HTMLElement
    expect(within(item).getByText('Missing: Business Email, ZIP Code')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: /Complete in Profile/i })).toHaveAttribute('href', '/profile?tab=1')
  })

  it('shows no hint once business information is complete', async () => {
    serve({ complete: true, missing_fields: [] })
    open()

    expect(await screen.findByText('Business Information')).toBeInTheDocument()
    expect(screen.queryByText(/^Missing:/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Complete in Profile/i })).not.toBeInTheDocument()
  })
})
