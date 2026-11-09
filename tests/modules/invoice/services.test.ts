import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { confirmAuthenticatedPayment, fetchInvoices, processUnifiedPayment } from '../../../src/modules/invoice/services'

afterEach(() => server.resetHandlers())

describe('fetchInvoices status fallback', () => {
  it('leaves an explicit status flag untouched', async () => {
    server.use(
      http.post('*/borrower/invoice', () => HttpResponse.json({ status: false, message: 'no invoices', data: [] }))
    )
    const result = await fetchInvoices()
    expect(result.status).toBe(false)
  })

  it('defaults status to true when omitted but data is an array', async () => {
    server.use(
      http.post('*/borrower/invoice', () => HttpResponse.json({ message: 'ok', data: [{ id: 1 }] }))
    )
    const result = await fetchInvoices()
    expect(result.status).toBe(true)
  })

  it('defaults status to false when omitted and data is not an array', async () => {
    server.use(
      http.post('*/borrower/invoice', () => HttpResponse.json({ message: 'ok', data: null }))
    )
    const result = await fetchInvoices()
    expect(result.status).toBe(false)
  })
})

describe('processUnifiedPayment', () => {
  it('posts the payment payload to the process-payment endpoint', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/process-payment', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: { success: true, payment_id: 55, status: 'succeeded' } })
      })
    )

    const result = await processUnifiedPayment({ payment_token: 'pm_123', invoice_id: 9, payment_method_id: 1 })

    expect(receivedBody).toEqual({ payment_token: 'pm_123', invoice_id: 9, payment_method_id: 1 })
    expect(result.data?.payment_id).toBe(55)
  })

  it('passes back the 3-D Secure hand-off untouched', async () => {
    server.use(
      http.post('*/borrower/process-payment', () =>
        HttpResponse.json({
          status: true,
          message: 'Your bank needs to verify this payment.',
          data: { success: false, requires_action: true, payment_id: 7, client_secret: 'pi_x_secret', status: 'pending' },
        })
      )
    )

    const result = await processUnifiedPayment({ payment_token: 'pm_123', invoice_id: 9, payment_method_id: 1 })

    expect(result.data).toEqual({ success: false, requires_action: true, payment_id: 7, client_secret: 'pi_x_secret', status: 'pending' })
  })
})

describe('confirmAuthenticatedPayment', () => {
  it('posts only the payment id to the confirm endpoint', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/process-payment/confirm', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Payment processed successfully.', data: { success: true, payment_id: 7, status: 'succeeded' } })
      })
    )

    const result = await confirmAuthenticatedPayment(7)

    expect(receivedBody).toEqual({ payment_id: 7 })
    expect(result.data?.status).toBe('succeeded')
  })
})
