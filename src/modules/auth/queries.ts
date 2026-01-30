import { useMutation } from '@tanstack/react-query'
import { login, logout, registerBorrower, forgotPassword, resetPassword } from './services'
import type { BorrowerRegistrationPayload } from './types'

export const useLogin = () => {
    return useMutation({
        mutationFn: ({ email, password, remember }: { email: string; password: string; remember?: boolean }) =>
            login(email, password, remember)
    })
}

export const useLogout = () => {
    return useMutation({
        mutationFn: logout
    })
}

export const useRegisterBorrower = () => {
    return useMutation({
        mutationFn: (payload: BorrowerRegistrationPayload) => registerBorrower(payload)
    })
}

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (email: string) => forgotPassword(email)
    })
}

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (payload: any) => resetPassword(payload)
    })
}
