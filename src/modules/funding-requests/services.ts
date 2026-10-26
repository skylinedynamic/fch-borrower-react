import { apiClient } from '../../lib/http/apiClient'

export const getBorrowerFundingRequests = async (params: any) => {
    const response = await apiClient.post('/borrower/funding/requests/list', params)
    return response.data
}

export const getBorrowerFundingRequest = async (id: number) => {
    const response = await apiClient.get(`/borrower/funding/requests/${id}`)
    return response.data
}

/**
 * Attach file-manager files to the borrower's documents under one document
 * type. A funding request lists the borrower's documents by type, so the file
 * appears on the request as well (BUG-088); the request itself is not changed.
 */
export const attachFundingRequestDocuments = async (filePaths: string[], documentTypeId: number, fundingSequenceId: number | string) => {
    const response = await apiClient.post('/borrower/funding/requests/documents/upload', {
        files: filePaths,
        document_type_id: documentTypeId,
        funding_sequence_id: fundingSequenceId,
    })
    return response.data
}

export const deleteFundingRequestDocument = async (documentId: number, fundingSequenceId: number | string) => {
    const response = await apiClient.delete(`/borrower/funding/requests/documents/${documentId}`, {
        params: { funding_sequence_id: fundingSequenceId },
    })
    return response.data
}
