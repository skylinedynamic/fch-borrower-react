import { apiClient } from '../../lib/http/apiClient'

export const getBorrowerActivityLogs = async (params: {
    funding_request_id?: number | string;
    page?: number;
    per_page?: number;
}) => {
    const response = await apiClient.post('/common/activity-logs/fetch-all-activities', params)
    return response.data
}
