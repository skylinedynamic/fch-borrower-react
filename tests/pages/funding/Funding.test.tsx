import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
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

/**
 * Defect (BUG-162 class): the search box applied only from the Filters
 * button - Enter did nothing. Enter now applies the search together with the
 * chosen product category, exactly as Filters does.
 */
describe('Funding - Enter applies the search and the category', () => {
  const OPTIONS = [
    { id: 11, name: 'Premium Rewards Cards', funding_type_id: 1, amount_range: '$10,000 - $500,000' },
    { id: 12, name: 'Business Credit Builder', funding_type_id: 1, amount_range: '$2,000 - $100,000' },
    { id: 21, name: 'Premium Term Loan', funding_type_id: 2, amount_range: '$50,000 - $1,000,000' },
  ]
  const searches: string[] = []

  const serveOptions = () => {
    searches.length = 0
    server.use(
      http.get('*/borrower/funding', ({ request }) => {
        const search = new URL(request.url).searchParams.get('search') ?? ''
        searches.push(search)
        const matching = OPTIONS.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
        return HttpResponse.json({
          status: true,
          data: {
            groups: [{ id: 1, name: 'Funding Options', sequencings: matching }],
            types: [{ id: 1, name: 'Business Credit Cards' }, { id: 2, name: 'Term Loans' }],
            stats: {},
          },
        })
      })
    )
  }

  const searchBox = () => screen.getByPlaceholderText('Search here...')

  it('searches when Enter is pressed in the search box', async () => {
    serveOptions()
    const user = userEvent.setup()
    renderWithProviders(<Funding />)
    expect(await screen.findByText('Business Credit Builder')).toBeInTheDocument()

    await user.type(searchBox(), 'Premium{Enter}')

    await waitFor(() => expect(searches).toContain('Premium'))
    expect(await screen.findByText('Premium Rewards Cards')).toBeInTheDocument()
    expect(screen.getByText('Premium Term Loan')).toBeInTheDocument()
    expect(screen.queryByText('Business Credit Builder')).not.toBeInTheDocument()
  })

  it('applies the chosen category with the search on Enter', async () => {
    serveOptions()
    const user = userEvent.setup()
    renderWithProviders(<Funding />)
    expect(await screen.findByText('Business Credit Builder')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All Product Categories' }))
    await user.click(screen.getByRole('button', { name: 'Term Loans' }))
    await user.type(searchBox(), 'Premium{Enter}')

    expect(await screen.findByText('Premium Term Loan')).toBeInTheDocument()
    expect(screen.queryByText('Premium Rewards Cards')).not.toBeInTheDocument()
    expect(screen.queryByText('Business Credit Builder')).not.toBeInTheDocument()
    expect(searches[searches.length - 1]).toBe('Premium')
  })

  it('applies a chosen category on Enter with an empty search', async () => {
    serveOptions()
    const user = userEvent.setup()
    renderWithProviders(<Funding />)
    expect(await screen.findByText('Business Credit Builder')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All Product Categories' }))
    await user.click(screen.getByRole('button', { name: 'Term Loans' }))
    await user.type(searchBox(), '{Enter}')

    expect(await screen.findByText('Premium Term Loan')).toBeInTheDocument()
    expect(screen.queryByText('Business Credit Builder')).not.toBeInTheDocument()
    expect(screen.queryByText('Premium Rewards Cards')).not.toBeInTheDocument()
  })

  it('does not search on other keys, only on Enter or Filters', async () => {
    serveOptions()
    const user = userEvent.setup()
    renderWithProviders(<Funding />)
    expect(await screen.findByText('Business Credit Builder')).toBeInTheDocument()

    await user.type(searchBox(), 'Premium')

    expect(searches).toEqual([''])
    expect(screen.getByText('Business Credit Builder')).toBeInTheDocument()
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
