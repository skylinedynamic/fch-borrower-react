import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import { useAuthStore } from '../../../../src/store/auth'
import CreditProfileTab from '../../../../src/pages/profile/components/CreditProfileTab'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const bureauProfile = {
  id: 1,
  personal_info: { name: 'Jane Borrower', dob: '1990-01-01', ssn: '123456789', email: 'jane@example.com', phone: '5125550100' },
  addresses: [],
  metrics: {
    fico_score: 700,
    paydex_score: null,
    experian_intelliscore: null,
    equifax_score: null,
    active_tradelines: null,
    total_credit_limit: null,
    credit_utilization: null,
    recent_inquiries: null,
    delinquent_accounts: null,
    public_records: null,
    collections: null,
    delinquencies_30_60_90: null,
    summary: null,
    all_accounts_analysis: {},
    open_accounts_analysis: {},
  },
}

const resetAuth = () => useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: true }, userSubscription: null, rememberMe: true })

const renderTab = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CreditProfileTab />
    </QueryClientProvider>
  )
}

describe('CreditProfileTab — SSN reveal/hide (PII)', () => {
  afterEach(() => {
    server.resetHandlers()
    useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
    vi.restoreAllMocks()
  })

  it('masks the SSN by default, showing only the last 4 digits', async () => {
    resetAuth()
    server.use(
      http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: bureauProfile }))
    )

    renderTab()

    expect(await screen.findByText('***-**-6789')).toBeInTheDocument()
    expect(screen.queryByText('123456789')).not.toBeInTheDocument()
  })

  it('reveals the full SSN only after the user clicks "Reveal", and can hide it again', async () => {
    resetAuth()
    server.use(
      http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: bureauProfile }))
    )

    const user = userEvent.setup()
    renderTab()

    await screen.findByText('***-**-6789')
    await user.click(screen.getByRole('button', { name: /Reveal/i }))

    expect(await screen.findByText('123456789')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Hide/i }))
    await waitFor(() => expect(screen.getByText('***-**-6789')).toBeInTheDocument())
  })
})
