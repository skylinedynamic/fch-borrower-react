import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import BusinessDetails from '../../../../src/pages/profile/components/BusinessDetails'
import type { SaveBusinessDetailsRequest } from '../../../../src/modules/profile/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
// The cancel question is the app's delete modal, which drives Bootstrap's Modal;
// a synchronous fake shows and hides it without transition callbacks.
vi.mock('bootstrap/js/dist/modal', () => ({
  default: class {
    constructor(private el: HTMLElement) {}
    show() { this.el.classList.add('show') }
    hide() { this.el.classList.remove('show') }
    dispose() {}
  },
}))
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

const blankData: SaveBusinessDetailsRequest = {
  business_name: 'Acme Corp',
  business_ein: '',
  business_phone: '',
  business_email: 'acme@example.com',
  duns_number: '',
  business_address: '123 Main St',
  business_city: 'Austin',
  business_state: 'Texas',
  business_zip_code: '78701',
  business_website: '',
  business_entity_type: 'LLC',
  business_industry_type: 'Retail',
  business_country: 'United States',
}

function Harness({ onSaveClick }: { onSaveClick: () => void }) {
  const [data, setData] = useState<SaveBusinessDetailsRequest>(blankData)
  return <BusinessDetails data={data} onChange={setData} onSave={onSaveClick} onBack={() => {}} />
}

const renderComponent = () => {
  const queryClient = createTestQueryClient()
  const onSaveClick = vi.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Harness onSaveClick={onSaveClick} />
    </QueryClientProvider>
  )
  return { ...utils, onSaveClick }
}

describe('Profile — Business Details tab', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('sends the EIN as raw digits, not the displayed XX-XXXXXXX format', async () => {
    server.use(
      http.get('*/borrower/profile/business-info', () => HttpResponse.json({ status: true, data: {} }))
    )
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/profile/business-info', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Saved' })
      })
    )

    const user = userEvent.setup()
    renderComponent()

    const einInput = await screen.findByPlaceholderText('12-3456789')
    await user.type(einInput, '123456789')
    expect((einInput as HTMLInputElement).value).toBe('12-3456789')

    await user.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody.business_ein).toBe('123456789')
  })

  it('shows the borrower how an EIN is written', async () => {
    // "9 digit EIN" described the number but not the shape the field produces,
    // so a borrower typing nine digits saw a hyphen appear they had not asked
    // for and could not tell whether it counted.
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: true, data: {} })
      )
    )

    renderComponent()

    expect(await screen.findByPlaceholderText('12-3456789')).toBeInTheDocument()
  })

  it('leaves a short EIN to the server and shows its answer under the field', async () => {
    // The format is checked server-side only (App\Rules\BusinessEin); the field
    // only writes the number as XX-XXXXXXX.
    let sentEin: unknown
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: true, data: {} })
      ),
      http.post('*/borrower/profile/business-info', async ({ request }) => {
        sentEin = ((await request.json()) as Record<string, unknown>).business_ein
        return HttpResponse.json(
          { status: false, message: 'Validation failed', errors: { business_ein: ['Enter a 9-digit EIN as XX-XXXXXXX, e.g. 12-3456789.'] } },
          { status: 422 }
        )
      })
    )

    const user = userEvent.setup()
    renderComponent()

    const ein = await screen.findByPlaceholderText('12-3456789')
    await user.type(ein, '12345678')
    expect(ein).toHaveValue('12-345678')
    await user.click(screen.getByRole('button', { name: /save|update|next/i }))

    expect(await screen.findByText('Enter a 9-digit EIN as XX-XXXXXXX, e.g. 12-3456789.')).toBeInTheDocument()
    expect(sentEin).toBe('12345678')
    expect(screen.queryByText(/EIN must be 9 digits/i)).not.toBeInTheDocument()
  })

  // BUG-054: the EIN is optional - no required mark, and the form saves
  // without one. Once saved it is locked like the other business fields.
  it('marks the EIN as optional and saves the details without one', async () => {
    server.use(http.get('*/borrower/profile/business-info', () => HttpResponse.json({ status: true, data: {} })))
    let receivedBody: Record<string, unknown> | null = null
    server.use(
      http.post('*/borrower/profile/business-info', async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ status: true, message: 'Saved' })
      })
    )
    const user = userEvent.setup()
    const { onSaveClick } = renderComponent()

    const label = (await screen.findByText('Business EIN')).closest('label') as HTMLElement
    expect(label.querySelector('.text-danger')).toBeNull()
    expect(label.textContent).not.toContain('*')

    await user.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => expect(onSaveClick).toHaveBeenCalled())
    expect(receivedBody!.business_ein).toBeFalsy()
  })

  it('shows a business phone example a real US number could be', async () => {
    server.use(http.get('*/borrower/profile/business-info', () => HttpResponse.json({ status: true, data: {} })))
    renderComponent()

    expect(await screen.findByPlaceholderText('(555) 555-5555')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('(123) 456-7890')).not.toBeInTheDocument()
  })

  it('lets a complete EIN through', async () => {
    let posted = false
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: true, data: {} })
      ),
      http.post('*/borrower/profile/business-info', () => {
        posted = true
        return HttpResponse.json({ status: true, message: 'Saved' })
      })
    )

    const user = userEvent.setup()
    renderComponent()

    await user.type(await screen.findByPlaceholderText('12-3456789'), '123456789')
    await user.click(screen.getByRole('button', { name: /save|update|next/i }))

    await waitFor(() => expect(posted).toBe(true))
    expect(screen.queryByText(/EIN must be 9 digits/i)).not.toBeInTheDocument()
  })

  it('shows a server error on a locked field without losing its Change Request button', async () => {
    // A locked field (one the API already holds) can still be refused - the API
    // now checks every phone number is a real US one, and (124) 982-7457 is not.
    // The error and the button share the field's wrapper; the CSS in
    // custom.css sizes the button against the input (.locked-field-padding)
    // and drops the invalid icon (.is-invalid) so the two do not collide. The
    // layout itself is asserted in e2e/sidebar/profile/business-details-locked-error.spec.ts.
    const message = 'Enter a valid 10-digit US phone number, e.g. (555) 234-5678.'
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({
          status: true,
          data: { business_name: 'Acme Corp', business_ein: '123456789', business_phone: '1249827457' },
        })
      ),
      http.post('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: false, errors: { business_phone: [message] } }, { status: 422 })
      )
    )

    const user = userEvent.setup()
    renderComponent()

    const phone = (await screen.findByDisplayValue('(124) 982-7457')) as HTMLInputElement
    await user.click(screen.getByRole('button', { name: /Save Changes/i }))

    const error = await screen.findByText(message)
    const wrapper = phone.closest('.position-relative') as HTMLElement

    expect(wrapper).toContainElement(error)
    expect(wrapper.querySelector('.change-request-btn')).toHaveTextContent('Change Request')
    expect(phone).toHaveClass('is-invalid', 'locked-field-padding')
    expect(phone).toHaveAttribute('readonly')
  })
})

/**
 * Round 2 BUG-039: a change request for the value already on file, and a
 * second one for a field already waiting for review, were both accepted. The
 * API refuses both now (shown in the modal), and a field waiting for review
 * says so instead of offering another Change Request.
 */
describe('Profile — Business Details › change requests (R2 BUG-039)', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  const lockedPhone = () =>
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: true, data: { business_name: 'Acme Corp', business_phone: '5555550122', business_email: 'acme@example.com' } })
      )
    )
  const pending = (fields: Array<{ id: number; field_name: string; entity_id: number | null }>) =>
    server.use(http.get('*/borrower/profile/change-requests/pending', () => HttpResponse.json({ status: true, data: fields })))
  const wrapperOf = async (value: string) => ((await screen.findByDisplayValue(value)) as HTMLElement).closest('.position-relative') as HTMLElement

  it('a field waiting for review shows "Pending review" instead of Change Request', async () => {
    lockedPhone()
    pending([{ id: 46, field_name: 'business_phone', entity_id: null }])
    renderComponent()

    const phone = await wrapperOf('(555) 555-0122')
    await waitFor(() => expect(phone.querySelector('.change-request-btn')).toHaveTextContent('Pending review'))
    // Another locked field still offers it.
    expect((await wrapperOf('acme@example.com')).querySelector('.change-request-btn')).toHaveTextContent('Change Request')
  })

  it('once a request is sent, its field shows "Pending review"', async () => {
    lockedPhone()
    let sent = false
    server.use(
      http.post('*/borrower/profile/change-request', () => {
        sent = true
        return HttpResponse.json({ status: true, message: 'Your change request has been submitted for review.' })
      }),
      http.get('*/borrower/profile/change-requests/pending', () =>
        HttpResponse.json({ status: true, data: sent ? [{ id: 46, field_name: 'business_phone', entity_id: null }] : [] })
      )
    )
    const user = userEvent.setup()
    renderComponent()

    const phone = await wrapperOf('(555) 555-0122')
    await user.click(phone.querySelector('.change-request-btn') as HTMLElement)
    await user.type(await screen.findByPlaceholderText(/Enter the updated Phone Number/i), '5555550188')
    await user.click(screen.getByRole('button', { name: /Submit for Review/i }))

    await waitFor(() => expect(phone.querySelector('.change-request-btn')).toHaveTextContent('Pending review'))
  })

  it("shows the API's refusal of the same value in the modal, not as a toast", async () => {
    lockedPhone()
    server.use(
      http.post('*/borrower/profile/change-request', () =>
        HttpResponse.json({ status: false, message: 'This is already the value on your profile.', errors: { new_value: 'This is already the value on your profile.' } }, { status: 422 })
      )
    )
    const { toast } = await import('react-toastify')
    const user = userEvent.setup()
    renderComponent()

    const phone = await wrapperOf('(555) 555-0122')
    await user.click(phone.querySelector('.change-request-btn') as HTMLElement)
    await user.type(await screen.findByPlaceholderText(/Enter the updated Phone Number/i), '5555550122')
    await user.click(screen.getByRole('button', { name: /Submit for Review/i }))

    expect(await screen.findByText('This is already the value on your profile.')).toHaveClass('invalid-feedback')
    expect(toast.error).not.toHaveBeenCalled()
  })
})

// The borrower can cancel a request still waiting for review; it is deleted.
describe('Profile — Business Details › cancelling a pending change request', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  const serve = (cancel: () => Response) => {
    let cancelled = false
    const calls: string[] = []
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: true, data: { business_name: 'Acme Corp', business_phone: '5555550122' } })
      ),
      http.get('*/borrower/profile/change-requests/pending', () =>
        HttpResponse.json({ status: true, data: cancelled ? [] : [{ id: 46, field_name: 'business_phone', entity_id: null }] })
      ),
      http.delete('*/borrower/profile/change-requests/:id', ({ params }) => {
        calls.push(String(params.id))
        const response = cancel()
        if (response.status === 200) cancelled = true
        return response
      })
    )
    return calls
  }
  const phoneButton = async () =>
    ((await screen.findByDisplayValue('(555) 555-0122')) as HTMLElement).closest('.position-relative')!.querySelector('.change-request-btn') as HTMLElement

  it('"Pending review" asks first, then cancels that request and the field offers Change Request again', async () => {
    const calls = serve(() => HttpResponse.json({ status: true, message: 'Your change request has been cancelled.' }))
    const user = userEvent.setup()
    renderComponent()

    const button = await phoneButton()
    await waitFor(() => expect(button).toHaveTextContent('Pending review'))
    await user.click(button)

    expect(await screen.findByText('This change request is still waiting for review. It will be deleted, and you can send a new one for this field.')).toBeInTheDocument()
    expect(calls).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Yes, Delete It', hidden: true }))

    await waitFor(() => expect(calls).toEqual(['46']))
    await waitFor(async () => expect(await phoneButton()).toHaveTextContent('Change Request'))
  })

  it('Close shuts the question and cancels nothing', async () => {
    const calls = serve(() => HttpResponse.json({ status: true, message: 'Cancelled.' }))
    const user = userEvent.setup()
    renderComponent()

    const button = await phoneButton()
    await waitFor(() => expect(button).toHaveTextContent('Pending review'))
    await user.click(button)
    await user.click(await screen.findByRole('button', { name: 'Close', hidden: true }))

    // The delete modal stays in the page, hidden.
    await waitFor(() => expect(document.querySelector('.modal.show')).toBeNull())
    expect(calls).toEqual([])
    expect(await phoneButton()).toHaveTextContent('Pending review')
  })

  it("a request already reviewed shows the API's message in the question, not a toast", async () => {
    serve(() => HttpResponse.json({ status: false, message: 'This change request has already been processed and cannot be modified.' }, { status: 422 }))
    const { toast } = await import('react-toastify')
    const user = userEvent.setup()
    renderComponent()

    const button = await phoneButton()
    await waitFor(() => expect(button).toHaveTextContent('Pending review'))
    await user.click(button)
    await user.click(await screen.findByRole('button', { name: 'Yes, Delete It', hidden: true }))

    expect(await screen.findByText('This change request has already been processed and cannot be modified.')).toHaveClass('invalid-feedback')
    expect(toast.error).not.toHaveBeenCalled()
  })
})

// The note in the Change Request modal is a warning, not an info box.
describe('Profile — Business Details › the Change Request note', () => {
  afterEach(() => server.resetHandlers())

  it('is a warning section that says the change is reviewed first', async () => {
    server.use(
      http.get('*/borrower/profile/business-info', () =>
        HttpResponse.json({ status: true, data: { business_name: 'Acme Corp', business_phone: '5555550122' } })
      )
    )
    const user = userEvent.setup()
    renderComponent()

    const phone = ((await screen.findByDisplayValue('(555) 555-0122')) as HTMLElement).closest('.position-relative') as HTMLElement
    await user.click(phone.querySelector('.change-request-btn') as HTMLElement)

    const note = (await screen.findByText(/This field is verified and locked/)).closest('.change-request-notice') as HTMLElement
    expect(note).not.toBeNull()
    expect(note).toHaveClass('alert-warning')
    expect(note).not.toHaveClass('alert-info')
    expect(note.querySelector('.ri-error-warning-line')).not.toBeNull()
  })
})
