import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchDocumentTypes, fetchBorrowerDocuments, deleteDocument } from '../../../src/modules/documents/services'

afterEach(() => server.resetHandlers())

describe('documents services', () => {
  it('fetchDocumentTypes unwraps the data array', async () => {
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () =>
        HttpResponse.json({ status: true, data: [{ id: 1, name: 'W-9' }] })
      )
    )
    await expect(fetchDocumentTypes()).resolves.toEqual([{ id: 1, name: 'W-9' }])
  })

  it('fetchBorrowerDocuments unwraps the data object', async () => {
    server.use(
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, data: { documents: [] } }))
    )
    await expect(fetchBorrowerDocuments()).resolves.toEqual({ documents: [] })
  })

  it('deleteDocument DELETEs by id and returns the response', async () => {
    let calledId = ''
    server.use(
      http.delete('*/borrower/documents/:id', ({ params }) => {
        calledId = String(params.id)
        return HttpResponse.json({ status: true, message: 'Deleted' })
      })
    )
    await deleteDocument(9)
    expect(calledId).toBe('9')
  })
})
