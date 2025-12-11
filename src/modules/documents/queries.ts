import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchDocumentTypes, fetchBorrowerDocuments } from './services'

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: queryKeys.documents.types(),
    queryFn: fetchDocumentTypes,
  })
}

export const useBorrowerDocuments = () => {
  return useQuery({
    queryKey: queryKeys.documents.list(),
    queryFn: fetchBorrowerDocuments,
  })
}
