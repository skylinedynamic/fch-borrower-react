import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchCreditAccounts, applyForCreditAccount } from '../../../src/modules/credit-accounts/services'

afterEach(() => server.resetHandlers())

describe('fetchCreditAccounts', () => {
  it('posts the filter params and returns the full envelope', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/credit-builder/credit-accounts', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: [], meta: { total: 0 } })
      })
    )

    const result = await fetchCreditAccounts({ issuer: 'Chase' } as any)
    expect(receivedBody).toEqual({ issuer: 'Chase' })
    expect(result).toEqual({ status: true, data: [], meta: { total: 0 } })
  })
})

describe('applyForCreditAccount', () => {
  it('posts the optional status alongside the account id', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/credit-builder/credit-accounts/5/apply', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true })
      })
    )

    await applyForCreditAccount(5, 'applied')
    expect(receivedBody).toEqual({ status: 'applied' })
  })
})
