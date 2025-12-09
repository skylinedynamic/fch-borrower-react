import { apiClient } from '../../lib/http/apiClient'
import type { DocumentType, DocumentTypesResponse } from './types'

export const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
  const { data } = await apiClient.get<DocumentTypesResponse>('/borrower/documents/borrower-document-types')
  return data.data
}
