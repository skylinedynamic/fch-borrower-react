import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import { usePreQualificationForm } from '../../../../src/pages/prequalification/hooks/usePreQualificationForm'

afterEach(() => server.resetHandlers())

const renderPreQualForm = () => {
  const queryClient = createTestQueryClient()
  return renderHook(() => usePreQualificationForm(), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  })
}

const prefill = (overrides: Record<string, unknown> = {}) => ({
  id: null,
  business_name: 'Bo Co',
  industry_type: 'Retail',
  business_structure: 'LLC',
  monthly_revenue: '10000',
  annual_revenue: '120000',
  business_start_date: null,
  years_in_business: null,
  ...overrides,
})

/**
 * Defect (BUG-037, CP-PREQ-04): a borrower with no business start date in their
 * profile could not get past Business Details - Time in Business was read-only
 * ("Please set business start date in profile") and Next failed with "Years in
 * business is required". The step now takes the start date itself.
 */
describe('usePreQualificationForm business start date', () => {
  it('sends the start date the borrower picks when the profile has none', async () => {
    server.use(http.get('*/borrower/pre-qualification', () => HttpResponse.json({ status: true, data: prefill() })))
    let body: any = null
    server.use(
      http.post('*/borrower/pre-qualification/business-info', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true, data: { id: 'preq-1' } })
      })
    )

    const { result } = renderPreQualForm()
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.startDateOnFile).toBe(false)

    act(() => {
      result.current.setBusiness({ ...result.current.business, businessStartDate: '2021-03-15' })
    })
    await act(async () => {
      await result.current.handleBusinessInfoSubmit()
    })

    expect(body).toMatchObject({ business_start_date: '2021-03-15', years_in_business: null })
    expect(result.current.step).toBe(2)
  })

  it('does not send a start date when the profile already has one', async () => {
    server.use(
      http.get('*/borrower/pre-qualification', () =>
        HttpResponse.json({ status: true, data: prefill({ business_start_date: '2015-01-01', years_in_business: '10 Years' }) })
      )
    )
    let body: any = null
    server.use(
      http.post('*/borrower/pre-qualification/business-info', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true, data: { id: 'preq-1' } })
      })
    )

    const { result } = renderPreQualForm()
    await waitFor(() => expect(result.current.startDateOnFile).toBe(true))
    expect(result.current.business.yearsInBusiness).toBe('10 Years')

    await act(async () => {
      await result.current.handleBusinessInfoSubmit()
    })

    expect(body.business_start_date).toBeUndefined()
    expect(body.years_in_business).toBe('10 Years')
  })

  it('shows a start date error on the start date field', async () => {
    server.use(http.get('*/borrower/pre-qualification', () => HttpResponse.json({ status: true, data: prefill() })))
    server.use(
      http.post('*/borrower/pre-qualification/business-info', () =>
        HttpResponse.json(
          { status: false, message: 'Validation Error', errors: { business_start_date: ['Business start date cannot be in the future'] } },
          { status: 422 }
        )
      )
    )

    const { result } = renderPreQualForm()
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.handleBusinessInfoSubmit()
    })

    expect(result.current.businessErrors.businessStartDate).toBe('Business start date cannot be in the future')
    expect(result.current.step).not.toBe(2)
  })
})
