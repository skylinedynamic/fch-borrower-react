import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor, within, createTestQueryClient } from '../../../../test-utils'
import { server } from '../../../../mocks/server'
import AttestationStep from '../../../../../src/pages/fundapplication/components/steps/AttestationStep'
import type { Attestation } from '../../../../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ConfirmationModal drives Bootstrap's real Modal class, which schedules a
// transitionend-driven focus() call. jsdom never fires a real CSS transition,
// so that callback still runs (via bootstrap's own timeout fallback) against a
// ref that's already null once the test's component has unmounted, throwing
// an unrelated, unhandled "Cannot read properties of null (reading 'focus')"
// after the test itself has finished. Swapping in a synchronous fake avoids
// depending on transition events at all.
vi.mock('bootstrap/js/dist/modal', () => {
  class FakeModal {
    private el: HTMLElement
    constructor(el: HTMLElement) {
      this.el = el
    }
    show() {
      this.el.classList.add('show')
      this.el.style.display = 'block'
      // The real Modal strips aria-hidden (and adds aria-modal) once shown;
      // ConfirmationModal hardcodes aria-hidden="true" in its JSX because it
      // expects Modal.show() to flip it, so the fake must too - otherwise
      // every control inside the modal is invisible to role-based queries.
      this.el.removeAttribute('aria-hidden')
      this.el.setAttribute('aria-modal', 'true')
    }
    hide() {
      this.el.classList.remove('show')
      this.el.style.display = 'none'
      this.el.setAttribute('aria-hidden', 'true')
      this.el.removeAttribute('aria-modal')
    }
    dispose() {}
  }
  return { default: FakeModal }
})

const blankAttestation: Attestation = {
  signature_name: '',
  esign_consent: false,
  terms_consent: false,
  privacy_consent: false,
  credit_consent: false,
  legal_binding_consent: false,
}

function Harness({ isResigning }: { isResigning?: boolean }) {
  const [attestation, setAttestation] = useState<Attestation>(blankAttestation)
  return (
    <AttestationStep
      attestation={attestation}
      setAttestation={setAttestation}
      onSubmit={() => {}}
      onBack={() => {}}
      loading={false}
      fundingRequestId={3}
      isResigning={isResigning}
    />
  )
}

const renderStep = (isResigning?: boolean) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Harness isResigning={isResigning} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AttestationStep', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('shows a plain first-time signature screen when the application was never submitted', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({ status: true, data: { id: 3, attestation_authorization: false } })
      )
    )

    renderStep(false)
    await screen.findByText(/Electronic Signature & Consent/i)

    expect(screen.queryByText(/Re-Signature Required/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/previously submitted/i)).not.toBeInTheDocument()
  })

  it('flags a re-signature and asks the borrower to confirm a Resign, not a first Submission', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({ status: true, data: { id: 3, attestation_authorization: false } })
      )
    )

    const user = userEvent.setup()
    renderStep(true)
    await screen.findByText(/Electronic Signature & Consent/i)

    // The badge and the explanatory warning both call this out up front.
    expect(screen.getByText(/Re-Signature Required/i)).toBeInTheDocument()
    expect(screen.getByText(/previously submitted, but changes made since then require a new signature/i)).toBeInTheDocument()

    // Fill out the form so the Submit button is enabled.
    await user.type(screen.getByLabelText(/^Electronic Signature/i), 'Michael Chen')
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }

    await user.click(screen.getByRole('button', { name: /^Submit$/i }))

    // The confirmation modal must say "Resign", not "Submission" - the whole
    // point of the flag is that the borrower is re-signing, not signing fresh.
    await waitFor(() => expect(screen.getByText('Confirm Re-Signature')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Re-Sign & Resubmit/i })).toBeInTheDocument()
    expect(screen.queryByText('Confirm Submission')).not.toBeInTheDocument()
  })

  it('shows the previous signature for reference and leaves the new one empty', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({
          status: true,
          data: {
            id: 3,
            attestation_authorization: false,
            signature_data: null,
            requires_resign: true,
            previous_signature: { signature_name: 'Michael Chen', signed_at: 'Oct 06, 2026 5:06 PM', timezone: 'Asia/Dhaka' },
          },
        })
      )
    )

    renderStep(true)

    // Shown only - a panel, not a field - with the date exactly as the API
    // formatted it (already in the borrower's timezone, so no timezone label).
    const previous = await screen.findByRole('group', { name: /Previous signature/i })
    expect(within(previous).getByText('Michael Chen')).toBeInTheDocument()
    expect(within(previous).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(previous).getByText('Oct 06, 2026 5:06 PM')).toBeInTheDocument()
    expect(within(previous).getByText(/Signed On/i)).toBeInTheDocument()
    expect(screen.queryByText(/Asia\/Dhaka/)).not.toBeInTheDocument()
    expect(screen.getByText(/No longer valid/i)).toBeInTheDocument()
    // The re-sign notice sits with the signature it is about.
    expect(within(previous).getByText(/previously submitted, but changes made since then require a new signature/i)).toBeInTheDocument()

    // Re-signing is a fresh act: nothing carried over from the old signature.
    expect(screen.getByLabelText(/^New Electronic Signature/i)).toHaveValue('')
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).not.toBeChecked()
    }
    expect(screen.getByRole('button', { name: /^Submit$/i })).toBeDisabled()
  })

  it('shows the signature on file of a submitted application and asks for a new one to sign again', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({
          status: true,
          data: {
            id: 3,
            attestation_authorization: true,
            signature_data: {
              signature_name: 'Michael Chen',
              signed_at: '2026-10-06 11:06:18',
              timezone: 'Asia/Dhaka',
              esign_consent: true,
              terms_consent: true,
              credit_consent: true,
              legal_binding_consent: true,
            },
            requires_resign: false,
            previous_signature: null,
          },
        })
      )
    )

    const user = userEvent.setup()
    renderStep(false)

    const previous = await screen.findByRole('group', { name: /Previous signature/i })
    expect(within(previous).getByText('Michael Chen')).toBeInTheDocument()
    expect(within(previous).queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText(/Currently on file/i)).toBeInTheDocument()

    // The signature on file is never loaded into the new one.
    const fresh = screen.getByLabelText(/^New Electronic Signature/i)
    expect(fresh).toHaveValue('')
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).not.toBeChecked()
    }

    // Signing an already-signed application is confirmed as a re-signature.
    await user.type(fresh, 'Michael Chen')
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }
    await user.click(screen.getByRole('button', { name: /^Submit$/i }))

    await waitFor(() => expect(screen.getByText('Confirm Re-Signature')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Re-Sign & Resubmit/i })).toBeInTheDocument()
    expect(screen.queryByText('Confirm Submission')).not.toBeInTheDocument()
  })

  it('shows no previous signature on a first-time signing', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({
          status: true,
          data: { id: 3, attestation_authorization: false, signature_data: null, requires_resign: false, previous_signature: null },
        })
      )
    )

    renderStep(false)
    await screen.findByText(/Electronic Signature & Consent/i)

    expect(screen.queryByRole('group', { name: /Previous signature/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Previous Signature/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Electronic Signature/i)).toBeInTheDocument()
  })

  it('lets the borrower choose between typing a name and an e-signature, requiring only the one chosen', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({
          status: true,
          data: {
            id: 3,
            attestation_authorization: false,
            signature_data: null,
            requires_resign: false,
            previous_signature: null,
            signature_rules: { max_file_kb: 1024, mime_types: ['image/*'] },
          },
        })
      )
    )

    const user = userEvent.setup()
    renderStep(false)
    await screen.findByText(/Electronic Signature & Consent/i)

    // Typing a name is the default: the input form, and no signature box.
    expect(screen.getByRole('button', { name: /Type Name/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByPlaceholderText(/Enter your full legal name/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^File Manager$/i })).not.toBeInTheDocument()

    // E-signature swaps the input form for the signature box - never both.
    await user.click(screen.getByRole('button', { name: /E-Signature/i }))

    expect(screen.getByRole('button', { name: /E-Signature/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByPlaceholderText(/Enter your full legal name/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^File Manager$/i })).toBeInTheDocument()
    // The hint states the server's own limit.
    expect(screen.getByText(/JPG, JPEG, PNG.*Max 1 MB/i)).toBeInTheDocument()
    expect(screen.getByText(/the signature I provided above constitutes/i)).toBeInTheDocument()

    // Every consent ticked but no signature chosen: it cannot be submitted.
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }
    expect(screen.getByRole('button', { name: /^Submit$/i })).toBeDisabled()

    // Back to typing: the name alone is enough.
    await user.click(screen.getByRole('button', { name: /Type Name/i }))
    await user.type(screen.getByPlaceholderText(/Enter your full legal name/i), 'Michael Chen')
    expect(screen.getByRole('button', { name: /^Submit$/i })).toBeEnabled()
  })

  it('accepts any text as the typed name and stops the input at 255 characters', async () => {
    server.use(
      http.get('*/borrower/funding-application/attestation-authorization', () =>
        HttpResponse.json({
          status: true,
          data: { id: 3, attestation_authorization: false, signature_data: null, requires_resign: false, previous_signature: null },
        })
      )
    )

    const user = userEvent.setup()
    renderStep(false)
    await screen.findByText(/Electronic Signature & Consent/i)

    const name = screen.getByPlaceholderText(/Enter your full legal name/i)
    const submit = screen.getByRole('button', { name: /^Submit$/i })
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }

    // The browser itself stops the field at 255 characters.
    expect(name).toHaveAttribute('maxLength', '255')

    // No rule about which characters: digits and symbols are accepted, and
    // nothing is flagged as the borrower types.
    await user.type(name, 'Arafat 123 (CEO) @ Alpha')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(name).not.toHaveClass('is-invalid')
    expect(submit).toBeEnabled()

    // Typing past the limit goes nowhere.
    await user.clear(name)
    await user.click(name)
    await user.paste('x'.repeat(300))
    expect((name as HTMLInputElement).value.length).toBeLessThanOrEqual(255)
  })
})
