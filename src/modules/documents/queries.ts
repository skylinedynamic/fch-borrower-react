import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchDocumentTypes } from './services'

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: queryKeys.documents.types(),
    queryFn: fetchDocumentTypes,
  })
}
