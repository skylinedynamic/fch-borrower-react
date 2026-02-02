import { apiClient } from '../http/apiClient'

// Get fresh user details from the backend
export async function getUserDetails(): Promise<any> {
    try {
        const res = await apiClient.get('/borrower/user-details')
        const data = res?.data
        if (data?.status === true) {
            return data
        }
        return null
    } catch (err) {
        return null
    }
}
