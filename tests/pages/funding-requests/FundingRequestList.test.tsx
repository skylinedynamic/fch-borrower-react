import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import FundingRequestList from '../../../src/pages/funding-requests/FundingRequestList'
import { FUNDING_REVIEW_STATUS, FUNDING_APPLICATION_STATUS } from '../../../src/config/funding'

afterEach(() => server.resetHandlers())

const mockList = (rows: any[]) =>
  server.use(
    http.post('*/borrower/funding/requests/list', () =>
      HttpResponse.json({ status: true, data: rows, meta: { total: rows.length }, funding_types: [] })
    )
  )

describe('FundingRequestList', () => {
  it('renders without crashing once an empty list loads', async () => {
    mockList([])

    renderWithProviders(<FundingRequestList />)

    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  // Whether a submitted application may still be edited is the server's call
  // (its status order is at or below the editable limit), sent as
  // `application_is_editable`. The list shows Edit exactly when that is true.
  it('offers Edit Application (in addition to View Application) once the application is Submitted – Pending Review', async () => {
    mockList([
      {
        id: 1,
        funding_type: 'Business Line of Credit',
        status: FUNDING_REVIEW_STATUS.APPROVED,
        application_status: FUNDING_APPLICATION_STATUS.PENDING,
        application_is_editable: true,
        funding_application_id: 42,
      },
    ])

    renderWithProviders(<FundingRequestList />)
    const row = (await screen.findByRole('row', { name: /Business Line of Credit/i }))

    const editLink = within(row).getByRole('link', { name: /Edit Application/i })
    expect(editLink).toHaveAttribute('href', '/fund-application/1')

    const viewLink = within(row).getByRole('link', { name: /View Application/i })
    expect(viewLink).toHaveAttribute('href', '/my-applications/funding/42')

    expect(within(row).queryByRole('link', { name: /Continue Application/i })).not.toBeInTheDocument()
    expect(within(row).queryByRole('link', { name: /Process Application/i })).not.toBeInTheDocument()
  })

  it('still offers only Continue Application while the application is On Hold', async () => {
    mockList([
      {
        id: 2,
        funding_type: 'Equipment Financing',
        status: FUNDING_REVIEW_STATUS.APPROVED,
        application_status: 'On Hold',
        application_is_editable: true,
        funding_application_id: null,
      },
    ])

    renderWithProviders(<FundingRequestList />)
    const row = await screen.findByRole('row', { name: /Equipment Financing/i })

    expect(within(row).getByRole('link', { name: /Continue Application/i })).toHaveAttribute('href', '/fund-application/2')
    expect(within(row).queryByRole('link', { name: /Edit Application/i })).not.toBeInTheDocument()
    expect(within(row).queryByRole('link', { name: /View Application/i })).not.toBeInTheDocument()
  })

  it('still offers Edit Application past pending review, for as long as the application is editable', async () => {
    mockList([
      {
        id: 3,
        funding_type: 'SBA Loan',
        status: FUNDING_REVIEW_STATUS.APPROVED,
        application_status: 'Underwriting Review',
        application_is_editable: true,
        funding_application_id: 7,
      },
    ])

    renderWithProviders(<FundingRequestList />)
    const row = await screen.findByRole('row', { name: /SBA Loan/i })

    expect(within(row).getByRole('link', { name: /Edit Application/i })).toHaveAttribute('href', '/fund-application/3')
    expect(within(row).getByRole('link', { name: /View Application/i })).toHaveAttribute('href', '/my-applications/funding/7')
  })

  it('offers only View Application once the application is past the editable statuses', async () => {
    mockList([
      {
        id: 4,
        funding_type: 'Term Loan',
        status: FUNDING_REVIEW_STATUS.APPROVED,
        application_status: 'Matched to Lender',
        application_is_editable: false,
        funding_application_id: 9,
      },
    ])

    renderWithProviders(<FundingRequestList />)
    const row = await screen.findByRole('row', { name: /Term Loan/i })

    expect(within(row).getByRole('link', { name: /View Application/i })).toHaveAttribute('href', '/my-applications/funding/9')
    expect(within(row).queryByRole('link', { name: /Edit Application/i })).not.toBeInTheDocument()
  })
})
