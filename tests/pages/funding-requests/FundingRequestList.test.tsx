import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import FundingRequestList from '../../../src/pages/funding-requests/FundingRequestList'

afterEach(() => server.resetHandlers())

describe('FundingRequestList', () => {
  it('renders without crashing once an empty list loads', async () => {
    server.use(
      http.post('*/borrower/funding/requests/list', () =>
        HttpResponse.json({ status: true, data: [], meta: { total: 0 }, funding_types: [] })
      )
    )

    renderWithProviders(<FundingRequestList />)

    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})
