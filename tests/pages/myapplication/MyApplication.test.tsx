import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import MyApplication from '../../../src/pages/myapplication/MyApplication'

/**
 * My Applications (BUG-086 and the page's redesign): the "Ad space"
 * placeholder is gone, the page opens with the totals, and each table row
 * carries its column labels so it stacks into a card on a phone.
 */
const meta = (total: number) => ({ current_page: 1, last_page: 1, per_page: 5, total, from: 1, to: total })

type Fixture = { prequal?: object[]; prequalTotal?: number; funding?: object[]; fundingTotal?: number; advisor?: object | null }

const serve = ({ prequal = [], prequalTotal, funding = [], fundingTotal, advisor = null }: Fixture = {}) =>
  server.use(
    http.post('*/borrower/myapplication/pre-qualification', () => HttpResponse.json({ status: true, data: prequal, meta: meta(prequalTotal ?? prequal.length) })),
    http.post('*/borrower/myapplication/funding-application', () => HttpResponse.json({ status: true, data: funding, meta: meta(fundingTotal ?? funding.length) })),
    http.get('*/borrower/get-advisor', () => HttpResponse.json({ status: true, data: advisor }))
  )

const PREQUAL = { id: 11, funding_type: 'Working Capital', business_name: 'Acme Bakery LLC', industry: 'Food', date: '20 Oct 2026', requested_amount: '$50,000', status: 'Submitted' }
const FUNDING = { id: 8, purpose_of_funds: 'Equipment', entity_type: 'LLC', industry_type: 'Food', date: '21 Oct 2026', requested_amount: '$20,000', status: 'Underwriting Review', funding_request_id: 41 }

afterEach(() => server.resetHandlers())

describe('My Applications page', () => {
  it('no longer shows the advertisement placeholder', async () => {
    serve({ prequal: [PREQUAL] })
    renderWithProviders(<MyApplication />)

    await screen.findByText('Acme Bakery LLC')
    expect(screen.queryByText('Advertisements')).not.toBeInTheDocument()
    expect(screen.queryByText('Ad space')).not.toBeInTheDocument()
  })

  it('opens with the title, the call to action and the totals', async () => {
    serve({ prequal: [PREQUAL], prequalTotal: 7, funding: [FUNDING], fundingTotal: 3 })
    renderWithProviders(<MyApplication />)

    expect(screen.getByRole('heading', { name: 'My Applications' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Apply New Prequalification/ })).toHaveAttribute('href', '/pre-qualification')

    const prequalStat = await screen.findByRole('group', { name: 'Prequalification requests' })
    expect(await within(prequalStat).findByText('7')).toBeInTheDocument()
    const fundingStat = screen.getByRole('group', { name: 'Funding applications' })
    expect(await within(fundingStat).findByText('3')).toBeInTheDocument()
  })

  it('labels every cell with its column, so a row can stack on a phone', async () => {
    serve({ prequal: [PREQUAL], funding: [FUNDING] })
    renderWithProviders(<MyApplication />)

    const prequalRow = await screen.findByRole('row', { name: /Acme Bakery LLC/ })
    expect(within(prequalRow).getByText('Acme Bakery LLC').closest('td')).toHaveAttribute('data-label', 'Business Name')
    const fundingRow = await screen.findByRole('row', { name: /Equipment/ })
    expect(within(fundingRow).getByText('$20,000').closest('td')).toHaveAttribute('data-label', 'Requested Amount')
  })

  it('keeps each date on one line', async () => {
    serve({ prequal: [PREQUAL], funding: [FUNDING] })
    renderWithProviders(<MyApplication />)

    expect((await screen.findByText('21 Oct 2026')).closest('td')).toHaveClass('ma-nowrap')
    expect(screen.getByText('20 Oct 2026').closest('td')).toHaveClass('ma-nowrap')
  })

  it('shows the advisor with a way to book a meeting', async () => {
    serve({ advisor: { name: 'Dana Advisor', email: 'dana@fch.test', phone: '(555) 234-5678' } })
    renderWithProviders(<MyApplication />)

    expect(await screen.findByText('Dana Advisor')).toBeInTheDocument()
    expect(screen.getByText('Your Advisor')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Schedule a Meeting' })).toHaveAttribute('href', '/appointment')
  })

  it('opens a prequalification from its row, with no Action column', async () => {
    serve({ prequal: [PREQUAL] })
    server.use(http.get('*/borrower/pre-qualification/11', () => HttpResponse.json({ status: true, data: { id: 11, status: 'Submitted', business_name: 'Acme Bakery LLC' } })))
    renderWithProviders(<MyApplication />)

    const row = await screen.findByRole('row', { name: /Acme Bakery LLC/ })
    expect(screen.queryAllByRole('columnheader', { name: 'Action' })).toHaveLength(0)
    within(row).getByRole('button', { name: 'Working Capital' }).click()

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Pre-Qualification Details')).toBeInTheDocument()
  })

  it('invites a first prequalification when there is none, and says when there are no applications', async () => {
    serve()
    renderWithProviders(<MyApplication />)

    expect(await screen.findByText('No prequalification requests yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start a prequalification' })).toHaveAttribute('href', '/pre-qualification')
    expect(await screen.findByText('No funding applications yet')).toBeInTheDocument()
  })
})
