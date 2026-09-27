import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchDashboardData } from '../../../src/modules/dashboard/services'

afterEach(() => server.resetHandlers())

describe('fetchDashboardData', () => {
  it('returns the full response envelope', async () => {
    const envelope = { status: true, message: 'ok', data: { credit_score: 720 } }
    server.use(http.get('*/borrower/dashboard', () => HttpResponse.json(envelope)))
    await expect(fetchDashboardData()).resolves.toEqual(envelope)
  })
})
