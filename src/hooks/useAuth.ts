import { useAuthStore } from '../store/auth'
import { refreshUser as refreshUserService } from '../modules/auth-profile'

export const useAuth = () => {
  const { user, token, setUserData } = useAuthStore()

  const refreshUser = async () => {
    if (!token) return

    try {
      const responseUserData = await refreshUserService()
      if (responseUserData) {
        setUserData(responseUserData)
        return responseUserData
      }
    } catch (error) {
      console.error('Failed to refresh user details:', error)
    }
    return null
  }

  return {
    user,
    refreshUser
  }
}
