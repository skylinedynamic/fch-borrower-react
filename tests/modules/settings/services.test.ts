import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchBorrowerTheme } from '../../../src/modules/settings/services'

afterEach(() => server.resetHandlers())

describe('fetchBorrowerTheme', () => {
  it('returns the full response envelope', async () => {
    const envelope = { status: true, data: { primary_color: '#123456' } }
    server.use(http.get('*/borrower/borrower-theme', () => HttpResponse.json(envelope)))
    await expect(fetchBorrowerTheme()).resolves.toEqual(envelope)
  })
})
