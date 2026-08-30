import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import {
  fetchBusinessInfo,
  fetchFundingRequest,
  saveBusinessInfo,
  uploadFundingApplicationDocuments,
  deleteFundingApplicationDocument,
} from '../../../src/modules/funding-application/services'

afterEach(() => server.resetHandlers())

describe('fetch*Info funding_request_id query param', () => {
  it('includes funding_request_id in the query string when provided', async () => {
    let receivedParams: URLSearchParams | null = null
    server.use(
      http.get('*/borrower/funding-application/business-info', ({ request }) => {
        receivedParams = new URL(request.url).searchParams
        return HttpResponse.json({ status: true, message: 'ok', data: {} })
      })
    )

    await fetchBusinessInfo(42)
    expect(receivedParams!.get('funding_request_id')).toBe('42')
  })

  it('omits funding_request_id entirely when not provided', async () => {
    let receivedParams: URLSearchParams | null = null
    server.use(
      http.get('*/borrower/funding-application/funding-request', ({ request }) => {
        receivedParams = new URL(request.url).searchParams
        return HttpResponse.json({ status: true, message: 'ok', data: {} })
      })
    )

    await fetchFundingRequest()
    expect(receivedParams!.has('funding_request_id')).toBe(false)
  })
})

describe('saveBusinessInfo', () => {
  it('posts the payload and returns the unwrapped data', async () => {
    const payload = {
      id: null,
      full_name: 'Jane Borrower',
      business_name: 'Acme Corp',
      business_email: null,
      business_phone_no: null,
      business_country: null,
      business_country_code: null,
      business_address: null,
      business_city: null,
      business_state: null,
      business_postal_code: null,
      industry_type: null,
      entity_type: null,
      years_in_business: null,
      number_of_employees: null,
    }
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/funding-application/business-info', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'ok', data: { ...payload, id: 1 } })
      })
    )

    const result = await saveBusinessInfo(payload)
    expect(receivedBody).toEqual(payload)
    expect(result).toEqual({ ...payload, id: 1 })
  })
})

describe('document upload/delete', () => {
  it('uploadFundingApplicationDocuments posts the file list', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/funding-application/documents/upload', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ message: 'Uploaded' })
      })
    )

    const result = await uploadFundingApplicationDocuments({
      funding_application_id: 1,
      document_type_id: 2,
      files: ['data:base64,...'],
    })

    expect(receivedBody.document_type_id).toBe(2)
    expect(result.message).toBe('Uploaded')
  })

  it('deleteFundingApplicationDocument DELETEs the document by id', async () => {
    let calledUrl = ''
    server.use(
      http.delete('*/borrower/funding-application/documents/:id', ({ params }) => {
        calledUrl = String(params.id)
        return HttpResponse.json({ message: 'Deleted' })
      })
    )

    const result = await deleteFundingApplicationDocument(7)
    expect(calledUrl).toBe('7')
    expect(result.message).toBe('Deleted')
  })
})
