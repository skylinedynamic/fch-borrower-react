export interface DocumentType {
  id: number
  name: string
  sort_order: number
}

export interface DocumentTypesResponse {
  status: boolean
  message: string
  data: DocumentType[]
}
