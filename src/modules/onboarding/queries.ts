import { useAuthStore } from '../../store/auth'
import { useProfileCompletion } from '../profile'
import { toOnboardingSuggestion } from './progress'
import type { OnboardingSuggestion } from './types'

/**
 * The borrower's next Getting Started step, as worked out by the API on the
 * profile completion endpoint. Null until it has loaded, or if signed out.
 */
export function useOnboardingSuggestion(): OnboardingSuggestion | null {
  const signedIn = useAuthStore((state) => !!state.user)
  const { data } = useProfileCompletion({ enabled: signedIn })

  if (!signedIn) return null
  return toOnboardingSuggestion(data?.onboarding, data)
}
