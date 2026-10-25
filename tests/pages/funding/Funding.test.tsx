import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import Funding from '../../../src/pages/funding/Funding'

afterEach(() => server.resetHandlers())

describe('Funding', () => {
  it('renders the page heading once an empty funding options list loads', async () => {
    server.use(
      http.get('*/borrower/funding', () =>
        HttpResponse.json({ status: true, data: { groups: [], types: [], stats: {} } })
      )
    )

    renderWithProviders(<Funding />)

    expect(await screen.findByText('No funding options found')).toBeInTheDocument()
  })
})

describe('Funding overview', () => {
  it('shows each figure with what it means', async () => {
    server.use(
      http.get('*/borrower/funding', () =>
        HttpResponse.json({
          status: true,
          data: { groups: [], types: [], stats: { funding_readiness_score: 76, fico_score: 760, monthly_revenue: '$42,500', time_in_business: '2 Years' } },
        })
      )
    )

    renderWithProviders(<Funding />)

    expect(await screen.findByText('Out of 100')).toBeInTheDocument()
    expect(screen.getByText('Very Good')).toBeInTheDocument()
    expect(screen.getByText('Per month')).toBeInTheDocument()
    expect(screen.getByText('In business')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: /funding readiness/i })).toHaveAttribute('aria-valuenow', '76')
  })
})
