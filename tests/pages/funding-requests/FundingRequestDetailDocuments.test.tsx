import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import FundingRequestDetailPage from '../../../src/pages/funding-requests/FundingRequestDetailPage'

const api = vi.hoisted(() => ({
  review: {} as Record<string, unknown>,
  downloadMyDocument: vi.fn(),
  downloadApplicationDocument: vi.fn(),
}))

vi.mock('../../../src/modules/funding-requests/services', () => ({
  getBorrowerFundingRequest: async () => ({ success: true, data: api.review }),
}))
vi.mock('../../../src/modules/activity-log/services', () => ({
  getBorrowerActivityLogs: async () => ({ success: true, data: [], pagination: { total: 0, last_page: 1 } }),
  downloadActivityAttachment: vi.fn(),
}))
vi.mock('../../../src/modules/documents/services', () => ({ downloadBorrowerDocument: api.downloadMyDocument }))
vi.mock('../../../src/modules/my-application/services', () => ({ downloadFundingApplicationDocument: api.downloadApplicationDocument }))
vi.mock('../../../src/utils/fileDownload', () => ({
  downloadBlob: vi.fn(),
  downloadFileFromUrl: vi.fn(),
  handleFileDownload: (fetcher: () => unknown) => fetcher(),
}))

/**
 * Defect (QA 2026-10-16): Uploaded Documents always came from My Documents.
 * Now a row is the funding application's copy once there is one, and its
 * download must go through the application's document, not My Documents
 * (the ids belong to different tables).
 */
describe('FundingRequestDetailPage uploaded documents', () => {
  beforeEach(() => {
    api.downloadMyDocument.mockReset()
    api.downloadApplicationDocument.mockReset()
    api.review = {
      id: 3,
      status: 'Approved',
      funding_type: '0% Intro Business Cards',
      actual_documents: [
        { id: 6, source: 'application', document_name: 'Driver’s License', file_name: 'licence.pdf', document_url: 'http://x/storage/funding-application/1/FA-1/licence.pdf', status: 'Uploaded', created_at: '2026-10-16T03:14:00Z' },
        { id: 11, source: 'borrower', document_name: 'Business Bank Statements', file_name: 'march.pdf', document_url: 'http://x/storage/borrowers/1/march.pdf', status: 'Uploaded', created_at: '2026-10-16T03:13:00Z' },
      ],
    }
  })

  const renderPage = () =>
    renderWithProviders(
      <Routes><Route path="/funding-requests/:id" element={<FundingRequestDetailPage />} /></Routes>,
      { route: '/funding-requests/3' },
    )

  const downloadButtonFor = async (name: string) => {
    const row = (await screen.findByText(name)).closest('tr') as HTMLElement
    return within(row).getAllByRole('link').pop() ?? within(row).getAllByRole('button').pop()!
  }

  it('downloads an application copy from the funding application', async () => {
    renderPage()
    await userEvent.click(await downloadButtonFor('Driver’s License'))

    expect(api.downloadApplicationDocument).toHaveBeenCalledWith(6)
    expect(api.downloadMyDocument).not.toHaveBeenCalled()
  })

  it('downloads a My Documents file from My Documents', async () => {
    renderPage()
    await userEvent.click(await downloadButtonFor('Business Bank Statements'))

    expect(api.downloadMyDocument).toHaveBeenCalledWith(11)
    expect(api.downloadApplicationDocument).not.toHaveBeenCalled()
  })
})
