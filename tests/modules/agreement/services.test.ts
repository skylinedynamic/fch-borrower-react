import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { checkAgreementSign, submitAgreementSign, fetchSignedAgreementHtml } from '../../../src/modules/agreement/services'

afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

describe('agreement services', () => {
  it('checkAgreementSign returns the envelope on success', async () => {
    const envelope = { status: true, data: { must_sign: true } }
    server.use(http.get('*/borrower/agreement-sign/check', () => HttpResponse.json(envelope)))
    await expect(checkAgreementSign()).resolves.toEqual(envelope)
  })

  it('checkAgreementSign logs and rethrows on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.get('*/borrower/agreement-sign/check', () => HttpResponse.error()))
    await expect(checkAgreementSign()).rejects.toBeTruthy()
  })

  it('submitAgreementSign posts the signature payload', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/agreement-sign/submit', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Signed' })
      })
    )
    await submitAgreementSign({ signature: 'data:image/png;base64,...' } as any)
    expect(receivedBody).toEqual({ signature: 'data:image/png;base64,...' })
  })

  it('fetchSignedAgreementHtml uses the default (no userId) route when none is given', async () => {
    let calledPath = ''
    server.use(
      http.get('*/borrower/agreement-sign/signed-html', ({ request }) => {
        calledPath = new URL(request.url).pathname
        return HttpResponse.json({ status: true, data: { html: '<p>Agreement</p>' } })
      })
    )
    await fetchSignedAgreementHtml()
    expect(calledPath.endsWith('/borrower/agreement-sign/signed-html')).toBe(true)
  })

  it('fetchSignedAgreementHtml includes the userId in the path when given', async () => {
    let calledPath = ''
    server.use(
      http.get('*/borrower/agreement-sign/signed-html/:userId', ({ request, params }) => {
        calledPath = new URL(request.url).pathname
        return HttpResponse.json({ status: true, data: { html: `<p>${params.userId}</p>` } })
      })
    )
    await fetchSignedAgreementHtml(42)
    expect(calledPath.endsWith('/borrower/agreement-sign/signed-html/42')).toBe(true)
  })
})
