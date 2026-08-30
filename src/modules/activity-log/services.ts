import { apiClient } from '../../lib/http/apiClient'

export const getBorrowerActivityLogs = async (params: {
    funding_request_id?: number | string;
    funding_application_id?: number | string;
    pre_qualification_id?: number | string;
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
