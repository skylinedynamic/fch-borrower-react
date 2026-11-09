import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, within } from '../../../test-utils'
import { server } from '../../../mocks/server'
import { useAuthStore } from '../../../../src/store/auth/authStore'

vi.mock('react-toastify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-toastify')>()
  return { ...actual, toast: Object.assign(vi.fn(), { info: vi.fn(), success: vi.fn(), error: vi.fn(), warn: vi.fn() }) }
})

import CreditAccounts from '../../../../src/pages/credit-builder/creditvendorapplication/CreditAccounts'

/**
 * Credit Builder › Credit Accounts: the catalogue of credit accounts the
 * borrower can apply for, with the status they track on each.
 */
const account = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  card_name: `Card ${id}`,
  issuer: 'Uline',
  credit_category: 'Revolving',
  approval_level: 'Easy',
  typical_personal_fico_min: 650,
  time_in_business_min_months: 6,
  personal_guarantee: 'No',
  business_credit_profile: null,
  final_approval: 'Manual review',
  image_url: null,
  reference_url: `https://vendor.example/${id}`,
  status: null,
  ...overrides,
})

const BASE = '*/borrower/credit-builder/credit-accounts'

const serveList = (data: ReturnType<typeof account>[], meta = { current_page: 1, last_page: 1, total: data.length, from: 1, to: data.length, per_page: 12, path: '' }) => {
  const bodies: Record<string, unknown>[] = []
  server.use(http.post(BASE, async ({ request }) => {
    bodies.push((await request.json()) as Record<string, unknown>)
    return HttpResponse.json({ status: true, message: 'ok', data, meta })
  }))
  return bodies
}

beforeEach(() => {
  useAuthStore.setState({ user: { id: 1, current_tier: 3 } } as any)
  server.use(
    http.get('*/common/refresh-user', () => HttpResponse.json({ status: true, data: { user: { id: 1, current_tier: 3 } } })),
    http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.json({ status: true, message: 'ok', data: { name: 'Tier 4', title: 'Mature' } })),
    http.get(`${BASE}/filter-options`, () => HttpResponse.json({ status: true, message: 'ok', data: { categories: ['Revolving', 'Charge'], issuers: ['Uline', 'Amex'], application_statuses: [] } })),
  )
})

afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ user: null } as any)
})

describe('Credit Accounts', () => {
  it('opens with a hero saying how many accounts are available', async () => {
    serveList([account(1), account(2)], { current_page: 1, last_page: 2, total: 14, from: 1, to: 2, per_page: 2, path: '' })
    renderWithProviders(<CreditAccounts />)

    expect(screen.getByRole('heading', { level: 1, name: 'Credit Accounts' })).toBeInTheDocument()
    const hero = screen.getByRole('region', { name: 'Credit Accounts' })
    expect(await within(hero).findByText('14')).toBeInTheDocument()
    expect(within(hero).getByText('Accounts available')).toBeInTheDocument()
  })

  // current_tier is the tier's id (5), not its number: the hero shows the
  // tier's name from the Credit Builder progress, as the Overview does.
  it("shows the borrower's tier by its name, not the tier id", async () => {
    serveList([account(1)])
    renderWithProviders(<CreditAccounts />)

    const tier = screen.getByRole('group', { name: 'Your tier' })
    expect(await within(tier).findByText('Tier 4')).toBeInTheDocument()
    expect(within(tier).queryByText('5')).not.toBeInTheDocument()
  })

  it('says "No min" for time in business when the account has none, not "0 mo+"', async () => {
    serveList([account(1, { card_name: 'Any Age Card', time_in_business_min_months: 0 })])
    renderWithProviders(<CreditAccounts />)

    const card = await screen.findByRole('article', { name: 'Any Age Card' })
    const tib = within(card).getByText('TIB').closest('.ca-metric') as HTMLElement
    expect(tib).toHaveTextContent('No min')
    expect(within(card).queryByText('0 mo+')).not.toBeInTheDocument()
  })

  it('shows each account as a card with its requirements, status and a way to apply', async () => {
    serveList([account(1, { card_name: 'Uline Net 30', status: 'Approved', typical_personal_fico_min: 680, time_in_business_min_months: 12, business_credit_profile: 'Established profile' })])
    renderWithProviders(<CreditAccounts />)

    const card = await screen.findByRole('article', { name: 'Uline Net 30' })
    expect(within(card).getByText('Uline')).toBeInTheDocument()
    expect(within(card).getByText('Revolving')).toBeInTheDocument()
    expect(within(card).getByText('680')).toBeInTheDocument()
    expect(within(card).getByText('12 mo+')).toBeInTheDocument()
    expect(within(card).getByText('Not Required')).toBeInTheDocument() // PG Required: "No"
    expect(within(card).getByText('Established profile')).toBeInTheDocument()
    expect(within(card).getByText('Manual review')).toBeInTheDocument()
    expect(within(card).getByText('Easy')).toBeInTheDocument()
    expect(within(card).getByTestId('ca-status')).toHaveTextContent('Approved')

    const apply = within(card).getByRole('link', { name: /Apply now/i })
    expect(apply).toHaveAttribute('href', 'https://vendor.example/1')
    expect(apply).toHaveAttribute('target', '_blank')
  })

  it("shows the issuer's initials when the account has no logo, and the logo when it has one", async () => {
    serveList([
      account(1, { card_name: 'No Logo', issuer: 'Office Depot', image_url: null }),
      account(2, { card_name: 'With Logo', image_url: 'https://cdn.example/logo.png' }),
    ])
    const { container } = renderWithProviders(<CreditAccounts />)

    const bare = await screen.findByRole('article', { name: 'No Logo' })
    expect(within(bare).getByText('OD')).toBeInTheDocument()
    expect(bare.querySelector('img')).toBeNull()

    const withLogo = screen.getByRole('article', { name: 'With Logo' })
    expect(withLogo.querySelector('img')).toHaveAttribute('src', 'https://cdn.example/logo.png')
    expect(container).toBeTruthy()
  })

  it('says "Not applied" on an account with no status yet', async () => {
    serveList([account(1, { card_name: 'Fresh Card' })])
    renderWithProviders(<CreditAccounts />)

    const card = await screen.findByRole('article', { name: 'Fresh Card' })
    expect(within(card).getByTestId('ca-status')).toHaveTextContent('Not applied')
  })

  /**
   * BUG-028 (R2-CP-CBA-01) - by design, not a defect. The status is the
   * borrower's own note of where their application with the vendor stands;
   * the vendor decides, outside the portal. So any status can be picked from
   * any other, N/A straight to Approved included. Keep it that way.
   */
  it('lets the borrower mark an account with no status straight as Approved (by design, BUG-028)', async () => {
    serveList([account(56, { card_name: 'Vendor 56' })])
    const applied: Record<string, unknown>[] = []
    server.use(http.post(`${BASE}/56/apply`, async ({ request }) => {
      applied.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ status: true, message: 'Application marked as approved.', data: {} })
    }))
    const user = userEvent.setup()
    renderWithProviders(<CreditAccounts />)

    const card = await screen.findByRole('article', { name: 'Vendor 56' })
    await user.click(within(card).getByRole('button', { name: /Mark status/i }))

    const menu = screen.getByRole('menu', { name: /Mark as/i })
    const options = within(menu).getAllByRole('menuitemradio').map((o) => o.textContent?.trim())
    expect(options).toEqual(['Requested', 'Processing', 'Approved'])

    await user.click(within(menu).getByRole('menuitemradio', { name: 'Approved' }))
    await waitFor(() => expect(applied).toEqual([{ status: 'Approved' }]))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('marks the current status in the menu', async () => {
    serveList([account(1, { card_name: 'Tracked', status: 'Processing' })])
    const user = userEvent.setup()
    renderWithProviders(<CreditAccounts />)

    const card = await screen.findByRole('article', { name: 'Tracked' })
    await user.click(within(card).getByRole('button', { name: /Mark status/i }))

    expect(screen.getByRole('menuitemradio', { name: 'Processing' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Approved' })).toHaveAttribute('aria-checked', 'false')
  })

  it('searches when Enter is pressed and clears back to everything', async () => {
    const bodies = serveList([account(1)])
    const user = userEvent.setup()
    renderWithProviders(<CreditAccounts />)

    await screen.findByRole('article', { name: 'Card 1' })
    await user.type(screen.getByRole('searchbox', { name: /Search accounts/i }), 'uline{Enter}')
    await waitFor(() => expect(bodies[bodies.length - 1]).toMatchObject({ q: 'uline', page: 1 }))

    await user.click(screen.getByRole('button', { name: /Clear/i }))
    await waitFor(() => expect(bodies[bodies.length - 1]).toMatchObject({ q: '', category: '', issuer: '' }))
    expect(screen.getByRole('searchbox', { name: /Search accounts/i })).toHaveValue('')
  })

  it('says when nothing matches and offers to clear the filters', async () => {
    serveList([])
    renderWithProviders(<CreditAccounts />)

    expect(await screen.findByRole('heading', { name: 'No matching accounts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clear filters/i })).toBeInTheDocument()
  })

  it('is locked below Tier 2, with the way into the Guide, and loads no accounts', async () => {
    useAuthStore.setState({ user: { id: 1, current_tier: 0 } } as any)
    server.use(http.get('*/common/refresh-user', () => HttpResponse.json({ status: true, data: { user: { id: 1, current_tier: 0 } } })))
    const bodies = serveList([account(1)])
    renderWithProviders(<CreditAccounts />)

    expect(await screen.findByRole('heading', { name: /Credit accounts are locked/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Go to the Guide/i })).toHaveAttribute('href', '/credit-builder/guide')
    expect(screen.getByRole('searchbox', { name: /Search accounts/i })).toBeDisabled()
    expect(bodies).toHaveLength(0)
  })
})
