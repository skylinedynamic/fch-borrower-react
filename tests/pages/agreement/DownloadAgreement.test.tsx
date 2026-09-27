import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils'
import DownloadAgreement from '../../../src/pages/agreement/DownloadAgreement'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock, useParams: () => ({}) }
})

afterEach(() => navigateMock.mockClear())

describe('DownloadAgreement', () => {
  it('redirects to /not-found when no userId route param is present', async () => {
    renderWithProviders(<DownloadAgreement />)
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/not-found'))
  })
})
