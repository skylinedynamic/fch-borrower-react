import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchInvoices, processUnifiedPayment } from '../../../src/modules/invoice/services'

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
        return HttpResponse.json({ status: true, data: { id: 55 } })
      })
    )

    const result = await processUnifiedPayment({ payment_token: 'pm_123', invoice_id: 9, payment_method_id: 1 })

    expect(receivedBody).toEqual({ payment_token: 'pm_123', invoice_id: 9, payment_method_id: 1 })
    expect(result.data.id).toBe(55)
  })
})
