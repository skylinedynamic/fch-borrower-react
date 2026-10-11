import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchPayments, approvePayment, rejectPayment } from '../../../src/modules/payment/services'

afterEach(() => server.resetHandlers())

describe('payment services', () => {
  it('fetchPayments posts the filter params', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/payments/fetch-payments', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: [] })
      })
    )
    await fetchPayments({ status: 'pending' } as any)
    expect(receivedBody).toEqual({ status: 'pending' })
  })

  it('approvePayment posts the note to the id-scoped approve route', async () => {
    let calledPath = ''
    let receivedBody: unknown = null
    server.use(
      http.post('*/common/payments/:id/approve', async ({ request }) => {
        calledPath = new URL(request.url).pathname
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Approved' })
      })
    )
    await approvePayment(8, { note: 'Looks good' })
    expect(calledPath.endsWith('/common/payments/8/approve')).toBe(true)
    expect(receivedBody).toEqual({ note: 'Looks good' })
  })

  it('rejectPayment posts the reason to the id-scoped reject route', async () => {
    let calledPath = ''
    server.use(
      http.post('*/common/payments/:id/reject', ({ request }) => {
        calledPath = new URL(request.url).pathname
        return HttpResponse.json({ status: true, message: 'Rejected' })
      })
    )
    await rejectPayment(8, { reason: 'Insufficient documentation' })
    expect(calledPath.endsWith('/common/payments/8/reject')).toBe(true)
  })
})
