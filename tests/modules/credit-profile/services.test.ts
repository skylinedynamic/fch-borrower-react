import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchCreditProfile } from '../../../src/modules/credit-profile/services'

afterEach(() => server.resetHandlers())

describe('fetchCreditProfile', () => {
  it('returns the bureau-pulled CreditProfile shape when one exists', async () => {
    const profile = {
      id: 1,
      personal_info: { name: 'Jane Borrower', dob: null, ssn: null, email: null, phone: null },
      addresses: [],
      metrics: { fico_score: 700 } as any,
    }
    server.use(http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: profile })))
    await expect(fetchCreditProfile()).resolves.toEqual(profile)
  })

  it('returns the raw CreditProfileRequestData shape when no bureau profile has been pulled yet', async () => {
    const raw = { first_name: 'Jane', last_name: 'Borrower', ssn: '123456789' }
    server.use(http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: raw })))
    const result = await fetchCreditProfile()
    expect(result).toEqual(raw)
    expect((result as any)?.personal_info).toBeUndefined()
  })

  it('returns null when the borrower has no profile at all', async () => {
    server.use(http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: null })))
    await expect(fetchCreditProfile()).resolves.toBeNull()
  })
})
