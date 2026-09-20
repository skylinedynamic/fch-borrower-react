import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchResources, fetchResource } from '../../../src/modules/resources/services'

afterEach(() => server.resetHandlers())

describe('resources services', () => {
  it('fetchResources returns the full envelope', async () => {
    const envelope = { status: true, data: [{ id: 1, title: 'Guide' }] }
    server.use(http.get('*/borrower/resources', () => HttpResponse.json(envelope)))
    await expect(fetchResources()).resolves.toEqual(envelope)
  })

  it('fetchResource fetches a single resource by id', async () => {
    let calledId = ''
    server.use(
      http.get('*/borrower/resources/:id', ({ params }) => {
        calledId = String(params.id)
        return HttpResponse.json({ status: true, data: { id: 3, title: 'Deep Dive' } })
      })
    )
    await fetchResource(3)
    expect(calledId).toBe('3')
  })
})
