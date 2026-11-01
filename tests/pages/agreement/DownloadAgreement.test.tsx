import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { renderWithProviders } from '../../test-utils'
import DownloadAgreement from '../../../src/pages/agreement/DownloadAgreement'

const navigateMock = vi.fn()
let params: Record<string, string> = {}
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock, useParams: () => params }
})

afterEach(() => {
  navigateMock.mockClear()
  params = {}
  server.resetHandlers()
})

describe('DownloadAgreement', () => {
  it('redirects to /not-found when no userId route param is present', async () => {
    renderWithProviders(<DownloadAgreement />)
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/not-found'))
  })

  /**
   * E2E-013: a borrower flagged as signed (borrowers.has_sign) can have no
   * agreement_signs row - e.g. signed before the agreement builder existed.
   * The API then answers status true with empty HTML, and "My Agreement" in
   * the topbar dropped them on the generic 404 page.
   */
  it('explains that no signed copy is on file instead of a 404', async () => {
    params = { userId: '5' }
    server.use(
      http.get('*/borrower/agreement-sign/signed-html/5', () =>
        HttpResponse.json({ status: true, data: { content_html: '' } })
      )
    )

    renderWithProviders(<DownloadAgreement />)

    expect(await screen.findByText('No signed agreement on file')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalledWith('/not-found')
    expect(screen.queryByRole('button', { name: /Print/i })).toBeNull()
  })

  /**
   * A signed agreement made before the server built the record is HTML the
   * signer's browser sent, so it may hold anything: it is shown in a frame
   * where no script can run.
   */
  it('shows the signed agreement in a frame where no script can run', async () => {
    params = { userId: '5' }
    server.use(
      http.get('*/borrower/agreement-sign/signed-html/5', () =>
        HttpResponse.json({ status: true, data: { content_html: '<p>Terms</p><script>steal()</script>' } })
      )
    )

    renderWithProviders(<DownloadAgreement />)

    const frame = await screen.findByTitle('Agreement')
    const sandbox = (frame.getAttribute('sandbox') ?? 'missing').split(/\s+/)
    expect(sandbox).not.toContain('allow-scripts')
    // Same origin so the page can size and print it; modals for the print dialog.
    expect(sandbox).toEqual(expect.arrayContaining(['allow-same-origin', 'allow-modals']))
  })

  it('still goes to /not-found when the agreement cannot be fetched', async () => {
    params = { userId: '999' }
    server.use(
      http.get('*/borrower/agreement-sign/signed-html/999', () =>
        HttpResponse.json({ status: false, message: 'Agreement template not found' }, { status: 404 })
      )
    )

    renderWithProviders(<DownloadAgreement />)
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/not-found'))
  })
})
