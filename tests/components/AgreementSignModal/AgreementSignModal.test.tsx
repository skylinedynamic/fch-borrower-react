import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth/authStore'
import AgreementSignModal from '../../../src/components/AgreementSignModal/AgreementSignModal'
import { USER_REFRESHED_EVENT } from '../../../src/config/appConfig'
import { act } from '@testing-library/react'
import { MutationCache, QueryClient } from '@tanstack/react-query'

vi.mock('react-toastify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-toastify')>()
  return { ...actual, toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }
})

const TEMPLATE_HTML = '<!DOCTYPE html><html><head></head><body><form id="agreement-form"><input class="flatpickr"/></form></body></html>'

afterEach(() => useAuthStore.setState({ user: null, userSubscription: null } as any))

describe('AgreementSignModal calendar', () => {
  it('the agreement opens the app calendar in its date fields', async () => {
    useAuthStore.setState({ user: { id: 1, is_agreement_signed: false, is_free_trail: false }, userSubscription: null } as any)
    server.use(
      http.get('*/borrower/agreement-sign/check', () =>
        HttpResponse.json({ status: true, data: { needs_sign: true, template: { id: 7, template_html: TEMPLATE_HTML } } }),
      ),
    )

    renderWithProviders(<AgreementSignModal />)

    const frame = await screen.findByTitle('Agreement Content')
    expect(frame.getAttribute('srcdoc')).toContain('<form id="agreement-form">')
    expect(frame.getAttribute('srcdoc')).toContain('data-app-calendar')
  })
})

describe('AgreementSignModal versions', () => {
  const signIn = () =>
    useAuthStore.setState({ user: { id: 1, is_agreement_signed: false, is_free_trail: false }, userSubscription: null } as any)
  const check = (versionId: number, html: string) =>
    HttpResponse.json({ status: true, data: { needs_sign: true, template: { id: 7, version_id: versionId, version: versionId, template_html: html } } })
  const sign = async (user: ReturnType<typeof userEvent.setup>) => {
    await screen.findByTitle('Agreement Content')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Accept & Continue/ }))
  }

  it('signs the version of the agreement it was shown', async () => {
    signIn()
    let body: any = null
    server.use(
      http.get('*/borrower/agreement-sign/check', () => check(31, '<p>Terms v1</p>')),
      http.post('*/borrower/agreement-sign/submit', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true, message: 'Signed' })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<AgreementSignModal />)

    await sign(user)

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({ agreement_template_id: 7, agreement_template_version_id: 31 })
  })

  it('sends the values entered in the agreement, by field', async () => {
    signIn()
    let body: any = null
    server.use(
      http.get('*/borrower/agreement-sign/check', () => check(31, '<p>Terms</p>')),
      http.post('*/borrower/agreement-sign/submit', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true, message: 'Signed' })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<AgreementSignModal />)
    const frame = (await screen.findByTitle('Agreement Content')) as HTMLIFrameElement
    // What the agreement page holds once the borrower has filled it in.
    frame.contentDocument!.body.innerHTML =
      '<input type="text" data-field-id="name" value="Jane Doe"/><input type="checkbox" data-field-id="agree" checked/>'

    await sign(user)

    await waitFor(() => expect(body).not.toBeNull())
    expect(body.fields).toEqual({ name: 'Jane Doe', agree: true })
  })

  it('shows what the server says when a required field is missing', async () => {
    signIn()
    const message = 'Please complete every required field of the agreement.'
    server.use(
      http.get('*/borrower/agreement-sign/check', () => check(31, '<p>Terms</p>')),
      http.post('*/borrower/agreement-sign/submit', () =>
        HttpResponse.json({ status: false, message, errors: { fields: ['sig'] } }, { status: 422 })),
    )
    const user = userEvent.setup()
    renderWithProviders(<AgreementSignModal />)

    await sign(user)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message))
  })

  it('reloads the agreement, saying so, when its wording changed after it was opened', async () => {
    signIn()
    let checks = 0
    const message = 'This agreement has been updated since you opened it. Please reload and review it before signing.'
    server.use(
      http.get('*/borrower/agreement-sign/check', () => (++checks === 1 ? check(31, '<p>Terms v1</p>') : check(32, '<p>Terms v2</p>'))),
      http.post('*/borrower/agreement-sign/submit', () => HttpResponse.json({ status: false, message }, { status: 409 })),
    )
    const user = userEvent.setup()
    renderWithProviders(<AgreementSignModal />)

    await sign(user)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message))
    await waitFor(() => expect(screen.getByTitle('Agreement Content').getAttribute('srcdoc')).toContain('Terms v2'))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
})

/**
 * Guided signing: the fields to fill are counted and the signer is taken from
 * one to the next; the date signed fills itself; clicking "Sign here" opens
 * "Adopt your signature" and the signature lands on the signing line.
 */
describe('AgreementSignModal guided signing', () => {
  const PAGE = `
    <form id="agreement-form"><div class="doc" id="doc-root">
      <div class="p-field"><label>Full name *:</label><input type="text" class="p-input" data-field-id="name" required/></div>
      <div class="p-sign">
        <div class="p-field p-sign-col">
          <div class="p-sign-pad preview-dropzone" data-block-id="sig"><span class="p-sign-tag">Sign here</span><input type="text" class="p-input" data-field-id="sig" required value=""/></div>
        </div>
        <div class="p-field p-sign-col p-sign-col--date"><div class="p-sign-pad"><input type="text" class="flatpickr p-sig-input p-sign-date" data-field-id="sig:date" required/></div></div>
      </div>
    </div></form>`

  const open = async () => {
    useAuthStore.setState({ user: { id: 1, name: 'Jane Doe', is_agreement_signed: false, is_free_trail: false }, userSubscription: null } as any)
    let body: any = null
    server.use(
      http.get('*/borrower/agreement-sign/check', () =>
        HttpResponse.json({ status: true, data: { needs_sign: true, template: { id: 7, version_id: 31, template_html: '<p>Terms</p>' } } })),
      http.post('*/borrower/agreement-sign/submit', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true, message: 'Signed' })
      }),
    )
    renderWithProviders(<AgreementSignModal />)
    const frame = (await screen.findByTitle('Agreement Content')) as HTMLIFrameElement
    // jsdom does not lay out srcdoc: let the frame finish loading its blank page,
    // then put the agreement page in it and tell the guide it has loaded.
    await new Promise((resolve) => setTimeout(resolve, 50))
    const doc = frame.contentDocument!
    doc.body.innerHTML = PAGE
    frame.dispatchEvent(new Event('load'))
    return { doc, sent: () => body }
  }

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillText: vi.fn(), measureText: () => ({ width: 100 }), font: '', fillStyle: '', textAlign: '', textBaseline: '',
    } as any)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,SIGNED')
  })
  afterEach(() => vi.restoreAllMocks())

  it('fills the date signed and counts what is left to fill', async () => {
    const { doc } = await open()

    expect((doc.querySelector('[data-field-id="sig:date"]') as HTMLInputElement).value).toMatch(/^\d{2} [A-Z][a-z]{2}, \d{4}$/)
    expect(await screen.findByText('1 of 3')).toBeInTheDocument()
    expect(doc.querySelector('[data-field-id="name"]')!.closest('.p-field')).toHaveClass('asg-todo')
  })

  it('takes the signer to the next field to fill', async () => {
    const { doc } = await open()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Start/ }))

    expect(doc.querySelector('[data-field-id="name"]')!.closest('.p-field')).toHaveClass('asg-current')
  })

  it('uses the same primary buttons as the rest of the app', async () => {
    await open()

    expect(await screen.findByRole('button', { name: /Start/ })).toHaveClass('btn', 'btn-primary')
    expect(screen.getByRole('button', { name: /Accept & Continue/ })).toHaveClass('btn', 'btn-primary')
  })

  it('signs with an adopted signature and sends it', async () => {
    const { doc, sent } = await open()
    const user = userEvent.setup()
    const name = doc.querySelector('[data-field-id="name"]') as HTMLInputElement
    name.value = 'Jane Doe'
    name.dispatchEvent(new Event('input', { bubbles: true }))

    ;(window as any).__openFmForBlock('sig')
    await user.click(await screen.findByRole('button', { name: 'Apply signature' }))

    expect(doc.querySelector('[data-block-id="sig"] img')?.getAttribute('src')).toBe('data:image/png;base64,SIGNED')
    expect(await screen.findByText('3 of 3')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Accept & Continue/ }))
    await waitFor(() => expect(sent()).not.toBeNull())
    expect(sent().fields).toMatchObject({ name: 'Jane Doe', sig: 'data:image/png;base64,SIGNED' })
  })
})

/**
 * The host can require or waive the agreement while the borrower uses the
 * portal. Once the portal reloads the user (USER_REFRESHED_EVENT), the modal
 * asks again - no full reload needed.
 */
describe('AgreementSignModal after the user is refreshed', () => {
  const signIn = () =>
    useAuthStore.setState({ user: { id: 1, is_agreement_signed: false, is_free_trail: false }, userSubscription: null } as any)
  const needsSign = (yes: boolean) =>
    HttpResponse.json({
      status: true,
      data: yes ? { needs_sign: true, template: { id: 7, version_id: 1, version: 1, template_html: '<p>Terms</p>' } } : { needs_sign: false, template: null },
    })
  const userRefreshed = () => act(() => { window.dispatchEvent(new Event(USER_REFRESHED_EVENT)) })

  it('opens once the host requires it, without a full reload', async () => {
    signIn()
    let required = false
    let checks = 0
    server.use(http.get('*/borrower/agreement-sign/check', () => { checks += 1; return needsSign(required) }))
    renderWithProviders(<AgreementSignModal />)
    await waitFor(() => expect(checks).toBe(1))
    expect(screen.queryByTitle('Agreement Content')).not.toBeInTheDocument()

    required = true
    userRefreshed()

    expect(await screen.findByTitle('Agreement Content')).toBeInTheDocument()
    expect(checks).toBe(2)
  })

  it('closes once the host waives it', async () => {
    signIn()
    let required = true
    server.use(http.get('*/borrower/agreement-sign/check', () => needsSign(required)))
    renderWithProviders(<AgreementSignModal />)
    await screen.findByTitle('Agreement Content')

    required = false
    userRefreshed()

    await waitFor(() => expect(screen.queryByTitle('Agreement Content')).not.toBeInTheDocument())
  })

  it('keeps the thank-you screen after signing, though signing is no longer needed', async () => {
    signIn()
    let signed = false
    server.use(
      http.get('*/borrower/agreement-sign/check', () => needsSign(!signed)),
      http.post('*/borrower/agreement-sign/submit', () => {
        signed = true
        return HttpResponse.json({ status: true, message: 'Signed' })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<AgreementSignModal />)
    await screen.findByTitle('Agreement Content')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Accept & Continue/ }))
    const thanks = await screen.findByText('Thank You!')

    userRefreshed()

    await new Promise((r) => setTimeout(r, 50))
    expect(thanks).toBeInTheDocument()
  })

  // Flaky in CI: signing invalidates the check, and when that refetch
  // ("no longer needed") landed before the submit had marked success, the
  // modal closed and the thank-you screen never showed. Here the refetch is
  // made to land first, every time.
  it('shows the thank-you screen even when the post-signing check answers first', async () => {
    signIn()
    let signed = false
    server.use(
      http.get('*/borrower/agreement-sign/check', () => needsSign(!signed)),
      http.post('*/borrower/agreement-sign/submit', () => {
        signed = true
        return HttpResponse.json({ status: true, message: 'Signed' })
      }),
    )
    // A mutation's cache-level onSuccess is awaited before mutateAsync resolves,
    // so the check is refetched - and its answer rendered - before the submit
    // call returns to the component.
    const queryClient: QueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      mutationCache: new MutationCache({
        onSuccess: async () => {
          await queryClient.refetchQueries({ type: 'active' })
          // Let the "no longer needed" answer render before the submit returns.
          await new Promise((r) => setTimeout(r, 100))
        },
      }),
    })
    const user = userEvent.setup()
    renderWithProviders(<AgreementSignModal />, { queryClient })
    await screen.findByTitle('Agreement Content')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Accept & Continue/ }))

    expect(await screen.findByText('Thank You!')).toBeInTheDocument()
  })
})

/** Once signed, there is nothing to ask - until the host cancels the signature. */
describe('AgreementSignModal for a borrower who has signed', () => {
  it('does not ask the API at all, even after the user is refreshed', async () => {
    useAuthStore.setState({ user: { id: 1, is_agreement_signed: true, is_free_trail: false }, userSubscription: null } as any)
    let checks = 0
    server.use(http.get('*/borrower/agreement-sign/check', () => { checks += 1; return HttpResponse.json({ status: true, data: { needs_sign: false } }) }))
    renderWithProviders(<AgreementSignModal />)

    act(() => { window.dispatchEvent(new Event(USER_REFRESHED_EVENT)) })

    await new Promise((r) => setTimeout(r, 50))
    expect(checks).toBe(0)
  })

  it('asks again, and opens, once the host cancels the signature', async () => {
    useAuthStore.setState({ user: { id: 1, is_agreement_signed: true, is_free_trail: false }, userSubscription: null } as any)
    let checks = 0
    server.use(
      http.get('*/borrower/agreement-sign/check', () => {
        checks += 1
        return HttpResponse.json({ status: true, data: { needs_sign: true, template: { id: 7, version_id: 1, version: 1, template_html: '<p>Terms</p>' } } })
      }),
    )
    renderWithProviders(<AgreementSignModal />)

    // refresh-user brings the cancelled signature.
    act(() => {
      useAuthStore.setState({ user: { id: 1, is_agreement_signed: false, is_free_trail: false } } as any)
      window.dispatchEvent(new Event(USER_REFRESHED_EVENT))
    })

    expect(await screen.findByTitle('Agreement Content')).toBeInTheDocument()
    expect(checks).toBeGreaterThanOrEqual(1)
  })
})
