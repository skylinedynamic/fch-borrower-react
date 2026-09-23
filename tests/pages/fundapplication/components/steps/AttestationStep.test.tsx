import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor, createTestQueryClient } from '../../../../test-utils'
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
    await user.type(screen.getByLabelText(/Electronic Signature \(Full Legal Name\)/i), 'Michael Chen')
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
})
