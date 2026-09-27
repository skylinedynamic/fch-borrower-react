import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import CreditOverview from '../../../src/pages/credit-builder/creditoverview/CreditOverview'

afterEach(() => server.resetHandlers())

describe('CreditOverview', () => {
  it('renders once progress and task overview data load, without crashing', async () => {
    server.use(
      http.get('*/borrower/credit-builder/my-progress', () =>
        HttpResponse.json({ status: true, data: { current_tier: 1, progress_percent: 25 } })
      ),
      http.get('*/borrower/credit-builder/task-overview', () =>
        HttpResponse.json({ status: true, data: { completed: 1, total: 5 } })
      )
    )

    renderWithProviders(<CreditOverview />)

    expect(await screen.findByText('Credit Building Overview')).toBeInTheDocument()
  })
})
