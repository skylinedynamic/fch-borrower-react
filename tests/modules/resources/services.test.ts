import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchResources, fetchResource, fetchResourceFile } from '../../../src/modules/resources/services'

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

  // R3-BUG-003: the preview reads the file through the API, not the signed link.
  it('fetchResourceFile reads the file from the download endpoint', async () => {
    server.use(
      http.get('*/borrower/resources/:id/download', ({ params }) =>
        new HttpResponse(`%PDF-${params.id}`, { headers: { 'Content-Type': 'application/pdf' } }))
    )
    const file = await fetchResourceFile(7)
    expect(file).toBeInstanceOf(Blob)
    expect(file.type).toBe('application/pdf')
    expect(await file.text()).toBe('%PDF-7')
  })

  it('fetchResourceFile rejects when the API answers with an error', async () => {
    server.use(
      http.get('*/borrower/resources/:id/download', () =>
        HttpResponse.json({ status: false, message: 'File not found on server' }, { status: 400 }))
    )
    await expect(fetchResourceFile(7)).rejects.toThrow()
  })
})
