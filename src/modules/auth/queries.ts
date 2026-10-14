import { useMutation } from '@tanstack/react-query'
import { login, logout, forgotPassword, resetPassword } from './services'

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
