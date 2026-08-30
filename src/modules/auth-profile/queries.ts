import { useMutation } from '@tanstack/react-query'
import { updatePassword } from './services'
import { ChangePasswordPayload } from './types'

export const useUpdatePassword = () => {
    return useMutation({
        mutationFn: (payload: ChangePasswordPayload) => updatePassword(payload)
    })
}
