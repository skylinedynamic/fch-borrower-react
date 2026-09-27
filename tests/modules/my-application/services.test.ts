import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchPreQualificationRequests, fetchFundingApplications, fetchFundingApplicationDetail } from '../../../src/modules/my-application/services'

afterEach(() => server.resetHandlers())

describe('my-application services', () => {
  it('fetchPreQualificationRequests posts the page number', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/myapplication/pre-qualification', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: [] })
      })
    )
    await fetchPreQualificationRequests(3)
    expect(receivedBody).toEqual({ page: 3 })
  })

  it('fetchFundingApplications defaults to page 1', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/myapplication/funding-application', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: [] })
      })
    )
    await fetchFundingApplications()
    expect(receivedBody).toEqual({ page: 1 })
  })

  it('fetchFundingApplicationDetail returns a single application, not an array', async () => {
    server.use(
      http.get('*/common/request-application/funding-application/12', () =>
        HttpResponse.json({ status: true, data: { id: 12, status: 'submitted' } })
      )
    )
    const result = await fetchFundingApplicationDetail(12)
    expect(Array.isArray(result.data)).toBe(false)
    expect(result.data.id).toBe(12)
  })
})
