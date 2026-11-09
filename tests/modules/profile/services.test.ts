import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchPersonalInfo, savePersonalInfo, fetchProfileCompletion, fetchPendingChangeRequests, cancelChangeRequest } from '../../../src/modules/profile/services'

afterEach(() => server.resetHandlers())

describe('profile services', () => {
  it('fetchPersonalInfo unwraps the data object', async () => {
    server.use(
      http.get('*/borrower/profile/personal-info', () =>
        HttpResponse.json({ status: true, data: { first_name: 'Jane' } })
      )
    )
    await expect(fetchPersonalInfo()).resolves.toEqual({ first_name: 'Jane' })
  })

  it('savePersonalInfo posts the payload and returns the full envelope', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/profile/personal-info', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Saved', data: { first_name: 'Jane' } })
      })
    )
    const result = await savePersonalInfo({ first_name: 'Jane' } as any)
    expect(receivedBody).toEqual({ first_name: 'Jane' })
    expect(result.message).toBe('Saved')
  })

  it('fetchProfileCompletion returns the full completion status envelope', async () => {
    const envelope = { status: true, message: 'ok', data: { is_complete: false, personal: { is_complete: true, missing_fields: [] }, business: { is_complete: false, missing_fields: ['business_ein'] }, financial: { is_complete: false, missing_fields: [] } } }
    server.use(http.get('*/borrower/profile/completion', () => HttpResponse.json(envelope)))
    await expect(fetchProfileCompletion()).resolves.toEqual(envelope)
  })
})

// R2 BUG-039: which fields already have a change request waiting for review.
describe('fetchPendingChangeRequests', () => {
  it('returns the pending fields, a bank account one with its row id', async () => {
    server.use(
      http.get('*/borrower/profile/change-requests/pending', () =>
        HttpResponse.json({ status: true, data: [{ id: 46, field_name: 'business_phone', entity_id: null }, { id: 47, field_name: 'bank_name', entity_id: 7 }] })
      )
    )
    await expect(fetchPendingChangeRequests()).resolves.toEqual([
      { id: 46, field_name: 'business_phone', entity_id: null },
      { id: 47, field_name: 'bank_name', entity_id: 7 },
    ])
  })

  it('treats a missing list as none', async () => {
    server.use(http.get('*/borrower/profile/change-requests/pending', () => HttpResponse.json({ status: true })))
    await expect(fetchPendingChangeRequests()).resolves.toEqual([])
  })
})

describe('cancelChangeRequest', () => {
  it('deletes the pending request by its id and returns the message', async () => {
    let method = ''
    server.use(
      http.delete('*/borrower/profile/change-requests/46', ({ request }) => {
        method = request.method
        return HttpResponse.json({ status: true, message: 'Your change request has been cancelled.' })
      })
    )
    const result = await cancelChangeRequest(46)
    expect(method).toBe('DELETE')
    expect(result.message).toBe('Your change request has been cancelled.')
  })
})
