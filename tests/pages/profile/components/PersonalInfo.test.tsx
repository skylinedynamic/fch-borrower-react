import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import PersonalInfo from '../../../../src/pages/profile/components/PersonalInfo'
import type { SavePersonalInfoRequest } from '../../../../src/modules/profile/types'

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

/**
 * The Personal Info tab of the profile page.
 *
 * Retroactive coverage of behaviour that already shipped, so these are
 * characterization tests: they record what the tab does today rather than
 * driving a change.
 *
 * The parts worth holding are the ones a borrower would notice being wrong -
 * what they typed surviving to the request, the formatters that rewrite their
 * keystrokes as they type, and a server-side validation error reaching the
 * field it belongs to instead of vanishing into a toast.
 */

const blank: SavePersonalInfoRequest = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  home_address: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  home_phone: '',
  date_of_birth: '',
} as SavePersonalInfoRequest

/** The tab is controlled by its parent, so the test owns the state it edits. */
function Harness({ initial = blank }: { initial?: SavePersonalInfoRequest }) {
  const [data, setData] = useState<SavePersonalInfoRequest>(initial)

  return <PersonalInfo data={data} onChange={setData} onSave={() => {}} />
}

const renderTab = (initial?: SavePersonalInfoRequest) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Harness initial={initial} />
    </QueryClientProvider>
  )

describe('Profile — Personal Info tab', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('shows the values the API already holds for the borrower', async () => {
    server.use(
      http.get('*/borrower/profile/personal-info', () =>
        HttpResponse.json({
          status: true,
          data: { first_name: 'Jane', last_name: 'Okafor', email: 'jane@example.com' },
        })
      )
    )

    renderTab()

    expect(await screen.findByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Okafor')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
  })

  it('formats a phone number as it is typed', async () => {
    // The borrower types digits; the field rewrites them. Worth pinning because
    // it is the stored value that changes, not just what is displayed.
    server.use(
      http.get('*/borrower/profile/personal-info', () =>
        HttpResponse.json({ status: true, data: {} })
      )
    )

    const user = userEvent.setup()
    renderTab()

    // Phone Number and Home Phone share a placeholder; the first is the one
    // the tab marks required.
    const [phone] = await screen.findAllByPlaceholderText('(555) 555-5555')
    await user.type(phone, '5125550100')

    await waitFor(() => expect((phone as HTMLInputElement).value).toBe('(512) 555-0100'))
  })

  it('sends what the borrower entered when they save', async () => {
    let posted: Record<string, unknown> | null = null

    server.use(
      http.get('*/borrower/profile/personal-info', () =>
        HttpResponse.json({ status: true, data: { first_name: 'Jane' } })
      ),
      http.post('*/borrower/profile/personal-info', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ status: true, message: 'Saved' })
      })
    )

    const user = userEvent.setup()
    renderTab()

    const first = await screen.findByDisplayValue('Jane')
    await user.clear(first)
    await user.type(first, 'Janet')
    await user.click(screen.getByRole('button', { name: /save|update/i }))

    await waitFor(() => expect(posted).not.toBeNull())
    expect(posted).toMatchObject({ first_name: 'Janet' })
  })

  it('puts a server validation error on the field it belongs to', async () => {
    // A 422 that only reached a toast left the borrower re-reading the whole
    // form to find what the server objected to.
    server.use(
      http.get('*/borrower/profile/personal-info', () =>
        HttpResponse.json({ status: true, data: {} })
      ),
      http.post('*/borrower/profile/personal-info', () =>
        HttpResponse.json(
          { status: false, errors: { email: ['The email field must be a valid address.'] } },
          { status: 422 }
        )
      )
    )

    const user = userEvent.setup()
    renderTab()

    await user.click(await screen.findByRole('button', { name: /save|update/i }))

    expect(
      await screen.findByText(/email field must be a valid address/i)
    ).toBeInTheDocument()
  })

  it('renders while the API is still answering', () => {
    server.use(
      http.get('*/borrower/profile/personal-info', () =>
        HttpResponse.json({ status: true, data: {} })
      )
    )

    expect(() => renderTab()).not.toThrow()
  })
})
