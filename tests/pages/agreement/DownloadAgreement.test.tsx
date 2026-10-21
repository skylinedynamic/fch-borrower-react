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
