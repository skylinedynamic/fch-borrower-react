import { apiClient } from '../../lib/http/apiClient'

export const getBorrowerActivityLogs = async (params: {
    funding_request_id?: number | string;
    funding_application_id?: number | string;
    pre_qualification_id?: number | string;
    /** With an application: also the client's own "Everyone" notes (BUG-103). */
    include_client_notes?: boolean;
    page?: number;
    limit?: number;
}) => {
    const response = await apiClient.post('/borrower/activity-logs/fetch-all-activities', params)
    return response.data
}

export const downloadActivityAttachment = async (data: { activity_log_id: number | string; path: string }) => {
    const response = await apiClient.post("/borrower/activity-logs/attachments/download", data, {
        responseType: 'blob'
    });
    return response.data;
};
