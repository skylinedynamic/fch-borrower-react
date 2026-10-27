import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import Invoices from '../../../src/pages/invoices/Invoices'

/**
 * BUG-066: an empty invoice list always said "No invoices found. Contact your
 * partner to pay and unlock." - the free-plan lock wording - even for a paid
 * client whose search or filter simply matched nothing.
 */
const emptyList = () =>
  server.use(
    http.post('*/borrower/invoice', () =>
      HttpResponse.json({ status: true, data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 }, stats: null })
    )
  )

afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ token: undefined, user: null } as never)
})

describe('Invoices - empty list', () => {
  it('says there are no invoices, without the free-plan lock wording', async () => {
    useAuthStore.setState({ token: 't', user: { id: 1, name: 'Client One' } } as never)
    emptyList()
    renderWithProviders(<Invoices />)

    expect(await screen.findByText('No invoices found.')).toBeInTheDocument()
    expect(screen.queryByText(/Contact your partner/)).not.toBeInTheDocument()
  })

  it('says nothing matched once a search is applied', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ token: 't', user: { id: 1, name: 'Client One' } } as never)
    emptyList()
    renderWithProviders(<Invoices />)
    await screen.findByText('No invoices found.')

    await user.type(screen.getByPlaceholderText('Search invoices...'), 'ZZZNOPE')
    await user.click(screen.getByRole('button', { name: /filters/i }))

    await waitFor(() => expect(screen.getByText('No invoices match your search or filters.')).toBeInTheDocument())
    expect(screen.queryByText(/Contact your partner/)).not.toBeInTheDocument()
  })
})
