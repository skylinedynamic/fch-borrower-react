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

  it('refuses a short EIN without asking the server', async () => {
    // An EIN is nine digits. Finding that out after a round trip meant the
    // borrower lost the rest of the form to a 422 they could have been told
    // about while typing.
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

    await user.type(await screen.findByPlaceholderText('12-3456789'), '12345678')
    await user.click(screen.getByRole('button', { name: /save|update|next/i }))

    expect(await screen.findByText(/EIN must be 9 digits/i)).toBeInTheDocument()
    expect(posted).toBe(false)
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
})
