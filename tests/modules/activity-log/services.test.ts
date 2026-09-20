import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { getBorrowerActivityLogs } from '../../../src/modules/activity-log/services'

afterEach(() => server.resetHandlers())

describe('getBorrowerActivityLogs', () => {
  it('posts the scoping params (funding_request_id, page, limit) as given', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/activity-logs/fetch-all-activities', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: [] })
      })
    )

    await getBorrowerActivityLogs({ funding_request_id: 5, page: 1, limit: 20 })
    expect(receivedBody).toEqual({ funding_request_id: 5, page: 1, limit: 20 })
  })
})
