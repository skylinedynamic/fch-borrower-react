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
