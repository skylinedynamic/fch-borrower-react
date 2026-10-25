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

  describe('Choose Your Strategy', () => {
    const serve = (overview: Record<string, unknown>) => {
      useAuthStore.setState({ user: { name: 'Jane Borrower' } })
      server.use(
        http.get('*/borrower/capital-access/overview', () =>
          HttpResponse.json({
            status: true,
            data: { readiness_score: 72, readiness_status: 'Good', factors: [], estimated_total_access: '$0.00', ...overview },
          })
        )
      )
    }

    it('is offered when nothing stands in the way', async () => {
      serve({ reason_code: null })
      renderWithProviders(<CapitalAccess />)

      expect(await screen.findByRole('link', { name: /choose your strategy/i })).toHaveAttribute('href', '/credit-card-stacking/strategy')
    })

    it.each([
      'TIER_BELOW_MINIMUM',
      'FICO_BELOW_MINIMUM',
      'UTILIZATION_ABOVE_MAXIMUM',
      'RECENT_LATE_PAYMENTS',
      'REQUIREMENTS_NOT_MET',
    ])('is not shown while it is locked (%s)', async (reason_code) => {
      serve({ reason_code })
      renderWithProviders(<CapitalAccess />)

      await screen.findByText(/recommended next step/i)
      expect(screen.queryByRole('link', { name: /choose your strategy/i })).toBeNull()
      expect(screen.queryByRole('button', { name: /choose your strategy/i })).toBeNull()
      expect(screen.getByText(/open once the requirement above is met/i)).toBeInTheDocument()
    })

    it('stays offered, disabled, once every play is completed', async () => {
      serve({ reason_code: 'ALL_PLAYS_COMPLETED' })
      renderWithProviders(<CapitalAccess />)

      expect(await screen.findByRole('button', { name: /choose your strategy/i })).toBeDisabled()
    })
  })
})
