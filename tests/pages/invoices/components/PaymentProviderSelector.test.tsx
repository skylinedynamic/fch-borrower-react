import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const fetchPartnerPaymentMethods = vi.fn()
vi.mock('../../../../src/modules/invoice/services', () => ({
  fetchPartnerPaymentMethods: () => fetchPartnerPaymentMethods(),
}))

const toastError = vi.fn()
vi.mock('react-toastify', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }))

import PaymentProviderSelector from '../../../../src/pages/invoices/components/PaymentProviderSelector'

describe('PaymentProviderSelector', () => {
  afterEach(() => vi.clearAllMocks())

  it('renders a card per provider once loaded', async () => {
    fetchPartnerPaymentMethods.mockResolvedValue({
      status: true,
      data: [
        { id: 1, name: 'Stripe' },
        { id: 2, name: 'Bank Transfer' },
      ],
    })
    const onSelect = vi.fn()

    render(<PaymentProviderSelector invoice={{ id: 5 }} onSelect={onSelect} />)

    expect(await screen.findByText('Stripe')).toBeInTheDocument()
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('auto-selects the provider when exactly one is available', async () => {
    const onlyProvider = { id: 1, name: 'Stripe' }
    fetchPartnerPaymentMethods.mockResolvedValue({ status: true, data: [onlyProvider] })
    const onSelect = vi.fn()

    render(<PaymentProviderSelector invoice={{ id: 5 }} onSelect={onSelect} />)

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(onlyProvider))
  })

  it('shows an error state and toasts when the API call fails', async () => {
    fetchPartnerPaymentMethods.mockRejectedValue({ response: { data: { message: 'Server unavailable' } } })

    render(<PaymentProviderSelector invoice={{ id: 5 }} onSelect={vi.fn()} />)

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument()
    expect(toastError).toHaveBeenCalledWith('Server unavailable')
  })

  it('shows an empty state when there are no active providers', async () => {
    fetchPartnerPaymentMethods.mockResolvedValue({ status: true, data: [] })

    render(<PaymentProviderSelector invoice={{ id: 5 }} onSelect={vi.fn()} />)

    expect(await screen.findByText('No active payment providers are available.')).toBeInTheDocument()
  })
})
