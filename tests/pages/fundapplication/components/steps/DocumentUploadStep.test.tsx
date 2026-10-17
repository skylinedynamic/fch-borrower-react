import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test-utils'
import DocumentUploadStep from '../../../../../src/pages/fundapplication/components/steps/DocumentUploadStep'

const api = vi.hoisted(() => ({
  application: undefined as { id: number } | undefined,
  documentsFor: vi.fn(),
  none: [] as unknown[],
}))

vi.mock('../../../../../src/modules/funding-application/queries', () => ({
  useFundingRequest: () => ({ data: api.application }),
  useFundingApplicationDocuments: (id: number | null) => {
    api.documentsFor(id)
    return { data: api.none, isLoading: false }
  },
  useDeleteFundingApplicationDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadFundingApplicationDocuments: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../../../../src/modules/documents', () => ({
  useDocumentTypes: () => ({ data: api.none, isLoading: false }),
}))

const props = { onNext: vi.fn(), onBack: vi.fn(), loading: false, fundingRequestId: 3 }

/**
 * Defect (QA 2026-10-16): before the application was saved, the Documents step
 * used the funding request id (3) as the application id. The API then made a
 * second folder FA-3 next to the real application's FA-1.
 */
describe('DocumentUploadStep application id', () => {
  beforeEach(() => {
    api.application = undefined
    api.documentsFor.mockClear()
  })

  it('never uses the funding request id as the application id', () => {
    renderWithProviders(<DocumentUploadStep {...props} fundingApplicationId={null} />)

    expect(api.documentsFor).toHaveBeenCalled()
    expect(api.documentsFor).not.toHaveBeenCalledWith(3)
    expect(api.documentsFor).toHaveBeenLastCalledWith(null)
  })

  it('uses the application id once the application exists', () => {
    api.application = { id: 1 }
    renderWithProviders(<DocumentUploadStep {...props} fundingApplicationId={null} />)

    expect(api.documentsFor).toHaveBeenLastCalledWith(1)
    expect(api.documentsFor).not.toHaveBeenCalledWith(3)
  })
})
