import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockStripe = { createPaymentMethod: vi.fn() }
const mockElements = { getElement: vi.fn(() => ({})) }

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CardElement: (props: any) => <div data-testid="card-element" {...props} />,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}))

const updateDefaultPaymentMethod = vi.fn()
vi.mock('../../../src/modules/billings', () => ({
  updateDefaultPaymentMethod: (...args: unknown[]) => updateDefaultPaymentMethod(...args),
}))

import { StripeCardInputForm } from '../../../src/pages/billing-details/BillingDetails'

const selectedProvider = { id: 1, name: 'stripe' } as any

const renderForm = (submitting = false) => {
  const setSubmitting = vi.fn()
  const onSuccess = vi.fn()
  const onCancel = vi.fn()
  const utils = render(
    <StripeCardInputForm
      selectedProvider={selectedProvider}
      submitting={submitting}
      setSubmitting={setSubmitting}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
  return { ...utils, setSubmitting, onSuccess, onCancel }
}

describe('BillingDetails StripeCardInputForm', () => {
  afterEach(() => vi.clearAllMocks())

  it('submits only the Stripe payment method id — never raw card data', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({ paymentMethod: { id: 'pm_xyz789' }, error: null })
    updateDefaultPaymentMethod.mockResolvedValue({})

    const user = userEvent.setup()
    const { onSuccess } = renderForm()

    await user.click(screen.getByRole('button', { name: /Save New Card & Set Default/i }))

    await waitFor(() => expect(updateDefaultPaymentMethod).toHaveBeenCalled())
    const payload = updateDefaultPaymentMethod.mock.calls[0][0]
    expect(payload).toEqual({ provider_name: 'stripe', payment_method_id: 'pm_xyz789' })
    expect(payload).not.toHaveProperty('cardNumber')
    expect(payload).not.toHaveProperty('cvv')
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows an inline error and does not call the API when Stripe rejects the card', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({ paymentMethod: null, error: { message: 'Your card number is incorrect.' } })

    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /Save New Card & Set Default/i }))

    expect(await screen.findByText('Your card number is incorrect.')).toBeInTheDocument()
    expect(updateDefaultPaymentMethod).not.toHaveBeenCalled()
  })

  it('shows an inline error when the backend update fails', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({ paymentMethod: { id: 'pm_xyz789' }, error: null })
    updateDefaultPaymentMethod.mockRejectedValue({ response: { data: { message: 'Could not update payment method' } } })

    const user = userEvent.setup()
    const { onSuccess } = renderForm()

    await user.click(screen.getByRole('button', { name: /Save New Card & Set Default/i }))

    expect(await screen.findByText('Could not update payment method')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('disables the submit button while submitting', () => {
    renderForm(true)
    expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled()
  })
})
