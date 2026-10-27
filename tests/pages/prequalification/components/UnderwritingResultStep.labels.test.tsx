import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../mocks/server'
import { renderWithProviders, screen } from '../../../test-utils'
import UnderwritingResultStep from '../../../../src/pages/prequalification/components/UnderwritingResultStep'

/**
 * BUG-061: the borrower's underwriting result listed raw keys such as
 * borrower.full_name and codes such as NOT_PROVIDED. Every label the borrower
 * reads is in words.
 */
const completed = {
  id: 160,
  gpt_status: 'COMPLETED',
  status: 'Pending',
  underwriting_result: {
    assessment_title: 'Funding Readiness',
    readiness_snapshot: [
      { area: 'borrower.time_in_business', assessment: '5 years', source_status: 'BORROWER_REPORTED' },
      { area: 'derived.monthly_operating_cash_flow_stress_test', assessment: 'Adequate', source_status: 'DERIVED_FROM_SUPPLIED_DATA' },
      { area: 'borrower.business_website', assessment: '-', source_status: 'NOT_PROVIDED' },
    ],
    borrower_request_snapshot: [
      { field: 'borrower.full_name', value: 'QA-TEST Cert Client One', source: 'BORROWER_REPORTED' },
    ],
  },
}

afterEach(() => server.resetHandlers())

describe('Underwriting result - labels the borrower reads', () => {
  it('shows field names and sources in words, not internal codes', async () => {
    server.use(http.get('*/borrower/pre-qualification/160', () => HttpResponse.json({ status: true, message: 'ok', data: completed })))
    renderWithProviders(<UnderwritingResultStep preQualId={160} initialData={completed} />)

    expect(await screen.findAllByText('Time In Business')).not.toHaveLength(0)
    expect(screen.getAllByText('Monthly Operating Cash Flow Stress Test')).not.toHaveLength(0)
    expect(screen.getAllByText('Not Provided')).not.toHaveLength(0)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('QA-TEST Cert Client One')).toBeInTheDocument()

    const page = document.body.textContent ?? ''
    expect(page).not.toMatch(/borrower\.|derived\./)
    expect(page).not.toMatch(/BORROWER_REPORTED|DERIVED_FROM_SUPPLIED_DATA|NOT_PROVIDED/)
  })
})
