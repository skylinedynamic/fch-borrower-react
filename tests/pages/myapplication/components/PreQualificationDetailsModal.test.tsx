import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, within } from '../../../test-utils'
import { server } from '../../../mocks/server'
import PreQualificationDetailsModal from '../../../../src/pages/myapplication/components/PreQualificationDetailsModal'

/**
 * The Prequalification details dialog (redesign): the outcome first - status,
 * amount, readiness summary, strengths and what needs attention - then what
 * the client entered, grouped.
 */
const DETAIL = {
  id: 11,
  first_name: 'Michael', last_name: 'Chen', email: 'michael@alpha.test', phone_number: '(555) 234-5678',
  business_website: 'alpha.test', state_of_incorporation: 'Texas',
  business_name: 'Alpha Tech Solutions', industry_type: 'Veterinarian', business_structure: 'LLC',
  years_in_business: '3 years', monthly_revenue: '$40,000', annual_revenue: '$480,000',
  funding_requested_amount: '$500,000.00', funding_urgency: 'Within 30 days', purpose_of_funding: 'Inventory Purchase',
  purpose_note: '', personal_credit_score: '720', estimated_business_credit_score: '80',
  existing_business_debt: 1, debt_balance: '$12,000', notes: null, status: 'Approved',
  gpt_status: 'COMPLETED', gpt_generated_at: '20 Oct 2026',
  underwriting_result: {
    funding_readiness_summary: 'Strong revenue and credit support a working capital request.',
    strengths: ['Consistent monthly revenue'],
    areas_requiring_attention: ['Add three months of bank statements'],
  },
}

const serve = (data: Record<string, unknown> = DETAIL) =>
  server.use(http.get('*/borrower/pre-qualification/11', () => HttpResponse.json({ status: true, data })))

afterEach(() => server.resetHandlers())

describe('Prequalification details dialog', () => {
  it('leads with the status, the amount asked for and the business', async () => {
    serve()
    renderWithProviders(<PreQualificationDetailsModal isOpen toggle={() => {}} requestId={11} />)

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Alpha Tech Solutions', { selector: '.ma-detail-hero *' })).toBeInTheDocument()
    expect(within(dialog).getByText('Approved', { selector: '.ma-detail-hero *' })).toBeInTheDocument()
    expect(within(within(dialog).getByRole('group', { name: 'Requested amount' })).getByText('$500,000.00')).toBeInTheDocument()
  })

  it('shows the readiness summary, strengths and what needs attention', async () => {
    serve()
    renderWithProviders(<PreQualificationDetailsModal isOpen toggle={() => {}} requestId={11} />)

    const outcome = await screen.findByRole('region', { name: 'Underwriting outcome' })
    expect(within(outcome).getByText('Strong revenue and credit support a working capital request.')).toBeInTheDocument()
    expect(within(within(outcome).getByRole('list', { name: 'Strengths' })).getByText('Consistent monthly revenue')).toBeInTheDocument()
    expect(within(within(outcome).getByRole('list', { name: 'Needs attention' })).getByText('Add three months of bank statements')).toBeInTheDocument()
  })

  it('groups what the client entered, with "Not provided" for blanks', async () => {
    serve({ ...DETAIL, business_website: '' })
    renderWithProviders(<PreQualificationDetailsModal isOpen toggle={() => {}} requestId={11} />)

    const business = await screen.findByRole('region', { name: 'Business Details' })
    expect(within(business).getByText('Veterinarian')).toBeInTheDocument()
    const personal = screen.getByRole('region', { name: 'Personal Information' })
    expect(within(personal).getByText('Business Website').parentElement).toHaveTextContent('Not provided')
  })
})
