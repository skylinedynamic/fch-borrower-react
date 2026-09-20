import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchBillingDetails, fetchPaymentProviders } from '../../../src/modules/billings/services'

afterEach(() => server.resetHandlers())

describe('fetchBillingDetails data-unwrap fallback', () => {
  it('unwraps data.data when the envelope wraps it', async () => {
    server.use(
      http.get('*/borrower/billing-details', () =>
        HttpResponse.json({ status: true, data: { subscription_status: 'Active' } })
      )
    )
    await expect(fetchBillingDetails()).resolves.toEqual({ subscription_status: 'Active' })
  })

  it('falls back to the raw body when there is no nested data field', async () => {
    server.use(
      http.get('*/borrower/billing-details', () => HttpResponse.json({ subscription_status: 'Active' }))
    )
    await expect(fetchBillingDetails()).resolves.toEqual({ subscription_status: 'Active' })
  })
})

describe('fetchPaymentProviders', () => {
  it('unwraps the provider list from data.data', async () => {
    server.use(
      http.get('*/common/partner-payment-providers', () =>
        HttpResponse.json({ status: true, data: [{ id: 1, name: 'Stripe', display_name: 'Stripe', status: true }] })
      )
    )
    await expect(fetchPaymentProviders()).resolves.toEqual([
      { id: 1, name: 'Stripe', display_name: 'Stripe', status: true },
    ])
  })
})
