import { apiClient } from '../http/apiClient'
import { useAuthStore } from '../../store/auth'
import { refreshUser as refreshUserService } from '../../modules/auth-profile'

// Local helper to perform the same logic as the useAuth hook but in a non-React context
async function refreshUser() {
    const { setUserData } = useAuthStore.getState()
    try {
        const responseUserData = await refreshUserService()
        if (responseUserData) {
            setUserData(responseUserData)
            return responseUserData
        }
    } catch (error) {
        console.error('Failed to refresh user details in authApi:', error)
    }
    return null
}

// Get fresh user details from the backend
export async function getUserDetails(): Promise<any> {
    try {
        const res = await apiClient.get('/borrower/user-details')
        const data = res?.data
        if (data?.status === true) {
            if (data?.data?.user?.is_refresh) {
                return await refreshUser();
            }
            return data
        }
        return null
    } catch (err) {
        return null
    }
}
