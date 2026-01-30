import { apiClient } from '../../lib/http/apiClient'
import { ChangePasswordPayload } from './types'

export async function updatePassword(payload: ChangePasswordPayload): Promise<any> {
    try {
        const res = await apiClient.post('/borrower/auth-profile/update-password', payload)
        const data = res?.data
        if (data?.status === true) {
            return data
        }
        const error: any = new Error(data?.message ?? 'Unable to update password.')
        error.response = { data }
        throw error
    } catch (err) {
        throw err
    }
}
