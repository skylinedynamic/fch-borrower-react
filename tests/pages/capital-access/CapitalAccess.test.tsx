import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import CapitalAccess from '../../../src/pages/capital-access/CapitalAccess'

afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
})

describe('CapitalAccess overview page', () => {
  it('greets the borrower by first name and shows the readiness score once loaded', async () => {
    useAuthStore.setState({ user: { name: 'Jane Borrower' } })
    server.use(
      http.get('*/borrower/capital-access/overview', () =>
        HttpResponse.json({
          status: true,
          data: {
            readiness_score: 72,
            readiness_status: 'Good',
            factors: [],
            estimated_total_access: '$50,000',
          },
        })
      )
    )

    renderWithProviders(<CapitalAccess />)

    expect(await screen.findByText(/Jane/i)).toBeInTheDocument()
  })

  it('shows an error page when the overview fails to load', async () => {
    server.use(http.get('*/borrower/capital-access/overview', () => HttpResponse.error()))

    renderWithProviders(<CapitalAccess />)

    expect(await screen.findByText(/Error loading capital access overview/i)).toBeInTheDocument()
  })
})
