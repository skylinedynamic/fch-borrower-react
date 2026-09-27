import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { getBorrowerFundingRequests, getBorrowerFundingRequest } from '../../../src/modules/funding-requests/services'

afterEach(() => server.resetHandlers())

describe('funding-requests services', () => {
  it('getBorrowerFundingRequests posts the list filter params', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/funding/requests/list', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: [] })
      })
    )
    await getBorrowerFundingRequests({ page: 2 })
    expect(receivedBody).toEqual({ page: 2 })
  })

  it('getBorrowerFundingRequest fetches a single request by id', async () => {
    server.use(
      http.get('*/borrower/funding/requests/11', () => HttpResponse.json({ status: true, data: { id: 11 } }))
    )
    await expect(getBorrowerFundingRequest(11)).resolves.toEqual({ status: true, data: { id: 11 } })
  })
})
