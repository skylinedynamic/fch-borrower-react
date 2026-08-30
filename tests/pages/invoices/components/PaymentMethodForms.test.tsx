import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fs from 'node:fs'
import path from 'node:path'

const mockStripe = { createPaymentMethod: vi.fn() }
const mockElements = { getElement: vi.fn(() => ({})) }

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CardElement: (props: any) => (
    <div data-testid="card-element" onClick={() => props.onChange?.({ complete: true })} />
  ),
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}))

vi.mock('../../../../src/lib/stripe', () => ({
  getStripe: vi.fn(() => Promise.resolve({})),
}))

const processUnifiedPayment = vi.fn()
vi.mock('../../../../src/modules/invoice/services', () => ({
  processUnifiedPayment: (...args: unknown[]) => processUnifiedPayment(...args),
}))

const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock('react-toastify', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: (...args: unknown[]) => toastSuccess(...args) },
}))

import { StripeForm } from '../../../../src/pages/invoices/components/PaymentMethodForms'

const invoice = { id: 42 }
const selectedProvider = { id: 7, publishable_key: 'pk_test_123' }

const renderForm = () => {
  const onPaymentSuccess = vi.fn()
  const onCancel = vi.fn()
  const utils = render(
    <StripeForm
      amount={100}
      invoice={invoice}
      selectedProvider={selectedProvider}
      onPaymentSuccess={onPaymentSuccess}
      onCancel={onCancel}
    />
  )
  return { ...utils, onPaymentSuccess, onCancel }
}

describe('StripeForm', () => {
  const originalReload = window.location.reload

  afterEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: originalReload },
    })
  })

  it('renders a loading state until the Stripe SDK resolves, then the card field', async () => {
    renderForm()
    expect(screen.getByText(/Initializing secure payment gateway/i)).toBeInTheDocument()
    expect(await screen.findByTestId('card-element')).toBeInTheDocument()
  })

  it('submits only the Stripe payment method id — never raw card data', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: vi.fn() },
    })
    mockStripe.createPaymentMethod.mockResolvedValue({ paymentMethod: { id: 'pm_abc123' }, error: null })
    processUnifiedPayment.mockResolvedValue({ status: true, data: { id: 999 } })

    const user = userEvent.setup()
    const { onPaymentSuccess } = renderForm()

    const card = await screen.findByTestId('card-element')
    await user.click(card) // marks the CardElement complete via onChange
    await user.click(screen.getByRole('button', { name: /Pay \$100\.00/i }))

    await waitFor(() => expect(processUnifiedPayment).toHaveBeenCalled())
    const payload = processUnifiedPayment.mock.calls[0][0]
    expect(payload).toEqual({ payment_token: 'pm_abc123', invoice_id: 42, payment_method_id: 7 })
    expect(payload).not.toHaveProperty('cardNumber')
    expect(payload).not.toHaveProperty('cvv')
    expect(onPaymentSuccess).toHaveBeenCalledWith(999)
  })

  it('shows an error toast and does not call the payment API when Stripe rejects the card', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({ paymentMethod: null, error: { message: 'Your card was declined.' } })

    const user = userEvent.setup()
    renderForm()

    const card = await screen.findByTestId('card-element')
    await user.click(card)
    await user.click(screen.getByRole('button', { name: /Pay \$100\.00/i }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Your card was declined.'))
    expect(processUnifiedPayment).not.toHaveBeenCalled()
  })

  it('shows an error toast and cancels when the backend rejects the payment', async () => {
    mockStripe.createPaymentMethod.mockResolvedValue({ paymentMethod: { id: 'pm_abc123' }, error: null })
    processUnifiedPayment.mockResolvedValue({ status: false, message: 'Card declined by issuer' })

    const user = userEvent.setup()
    const { onCancel } = renderForm()

    const card = await screen.findByTestId('card-element')
    await user.click(card)
    await user.click(screen.getByRole('button', { name: /Pay \$100\.00/i }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Card declined by issuer'))
    expect(onCancel).toHaveBeenCalled()
  })
})

describe('PCI regression guard: raw-card-capture forms must stay unwired', () => {
  it('AuthorizeNetForm, SquareForm, and EcryptForm are not imported anywhere outside their own definition file', () => {
    const srcDir = path.resolve(__dirname, '../../../../src')
    const offenders: string[] = []

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !full.endsWith(path.normalize('pages/invoices/components/PaymentMethodForms.jsx'))) {
          const content = fs.readFileSync(full, 'utf-8')
          if (/\b(AuthorizeNetForm|SquareForm|EcryptForm)\b/.test(content)) {
            offenders.push(full)
          }
        }
      }
    }

    walk(srcDir)

    expect(offenders).toEqual([])
  })
})
