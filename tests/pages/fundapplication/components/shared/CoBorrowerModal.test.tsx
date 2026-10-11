import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../../mocks/server'
import { createTestQueryClient } from '../../../../test-utils'
import CoBorrowerModal from '../../../../../src/pages/fundapplication/components/shared/CoBorrowerModal'
import type { CoBorrower } from '../../../../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('react-flatpickr', () => ({
  default: ({ value, onChange, className, placeholder }: any) => (
    <input
      className={className}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e: any) => onChange([e.target.value], e.target.value)}
    />
  ),
}))

const draft: CoBorrower = {
  id: null,
  firstName: 'John',
  lastName: 'Co',
  role: 'Owner',
  ownershipPct: '50',
  email: 'john@example.com',
  mobilePhone: '(512) 555-0101',
  homePhone: '',
  streetAddress: '456 Elm St',
  country: 'United States',
  city: 'Austin',
  state: 'Texas',
  zip: '78701',
  ssn: '',
  dob: '1985-05-05',
  driversLicenseNumber: '',
  driversLicenseState: '',
}

function Harness({ initial, onSubmit }: { initial: CoBorrower; onSubmit: (e: any) => void }) {
  const [coDraft, setCoDraft] = useState<CoBorrower>(initial)
  return <CoBorrowerModal coDraft={coDraft} setCoDraft={setCoDraft} onSubmit={onSubmit} isEditing={false} />
}

const renderModal = (coDraft: CoBorrower, onSubmit = vi.fn()) => {
  const queryClient = createTestQueryClient()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Harness initial={coDraft} onSubmit={onSubmit} />
    </QueryClientProvider>
  )
  return { ...utils, onSubmit }
}

describe('CoBorrowerModal — SSN handling', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('sends the unformatted SSN to the validation endpoint and calls onSubmit on success', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/myapplication/funding-application/co-borrower-validation', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true })
      })
    )

    const user = userEvent.setup()
    const { onSubmit } = renderModal({ ...draft, ssn: '123-45-6789' })

    await user.click(screen.getByRole('button', { name: /Add Co-Borrower/i, hidden: true }))

    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody.ssn).toBe('123456789')
    expect(onSubmit).toHaveBeenCalled()
  })

  it('formats digits typed into the SSN field as ###-##-####', async () => {
    const user = userEvent.setup()
    renderModal(draft)

    const ssnInput = screen.getByPlaceholderText('xxx-xx-xxxx')
    await user.type(ssnInput, '987654321')
    expect((ssnInput as HTMLInputElement).value).toBe('987-65-4321')
  })

  it('shows field-level validation errors on a 422 response and does not call onSubmit', async () => {
    server.use(
      http.post('*/borrower/myapplication/funding-application/co-borrower-validation', () =>
        HttpResponse.json({ message: 'Validation failed', errors: { ssn: 'This SSN is already in use.' } }, { status: 422 })
      )
    )

    const user = userEvent.setup()
    const { onSubmit } = renderModal({ ...draft, ssn: '111-11-1111' })

    await user.click(screen.getByRole('button', { name: /Add Co-Borrower/i, hidden: true }))

    expect(await screen.findByText('This SSN is already in use.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
