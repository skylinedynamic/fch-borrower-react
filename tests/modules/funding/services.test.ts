import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchBorrowerFunding, fetchFundingDetail, deleteFundingRequestDocument } from '../../../src/modules/funding/services'

afterEach(() => server.resetHandlers())

describe('funding services', () => {
  it('fetchBorrowerFunding forwards query params', async () => {
    let receivedParams: URLSearchParams | null = null
    server.use(
      http.get('*/borrower/funding', ({ request }) => {
        receivedParams = new URL(request.url).searchParams
        return HttpResponse.json({ status: true, data: [] })
      })
    )
    await fetchBorrowerFunding({ status: 'active' })
    expect(receivedParams!.get('status')).toBe('active')
  })

  it('fetchFundingDetail returns the full response body', async () => {
    server.use(
      http.get('*/borrower/funding/9', () => HttpResponse.json({ status: true, data: { id: 9 } }))
    )
    await expect(fetchFundingDetail('9')).resolves.toEqual({ status: true, data: { id: 9 } })
  })

  it('deleteFundingRequestDocument DELETEs by document id', async () => {
    let calledId = ''
    server.use(
      http.delete('*/borrower/funding-application/documents/:id', ({ params }) => {
        calledId = String(params.id)
        return HttpResponse.json({ status: true, message: 'Deleted' })
      })
    )
    await deleteFundingRequestDocument(4)
    expect(calledId).toBe('4')
  })
})
