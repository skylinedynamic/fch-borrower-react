import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { cancelEmailChange, resendEmailChange } from '../../../src/modules/account/services'

afterEach(() => server.resetHandlers())

/**
 * A new email saved on the profile waits as pending until the link sent to it
 * is confirmed. The borrower can resend that link or withdraw the change; both
 * act on the signed-in login, so no user id is sent.
 */
describe('resendEmailChange', () => {
  it('posts to the borrower endpoint and returns the pending email', async () => {
    let body: unknown = 'not sent'
    server.use(
      http.post('*/borrower/profile/email-change/resend', async ({ request }) => {
        body = await request.text()
        return HttpResponse.json({ status: true, message: 'A new confirmation link has been sent to new@example.com.', data: { pending_email: 'new@example.com' } })
      })
    )

    await expect(resendEmailChange()).resolves.toEqual({ pending_email: 'new@example.com' })
    expect(body).toBe('')
  })
})

describe('cancelEmailChange', () => {
  it('posts to the borrower endpoint and returns no pending email', async () => {
    server.use(
      http.post('*/borrower/profile/email-change/cancel', () =>
        HttpResponse.json({ status: true, message: 'The pending email change has been cancelled.', data: { pending_email: null } })
      )
    )

    await expect(cancelEmailChange()).resolves.toEqual({ pending_email: null })
  })
})
