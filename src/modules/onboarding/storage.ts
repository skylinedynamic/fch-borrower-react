/**
 * Browser-side memory for the Getting Started popup. Purely a convenience, so
 * storage failures (private mode, blocked site data) are swallowed and the
 * popup simply opens again.
 *
 * Which step it last opened for lives in sessionStorage and is cleared on
 * logout: the popup opens once per step per login.
 */

const SESSION_PREFIX = 'fch:onboarding:session-step:'

const read = (storage: () => Storage, key: string): string | null => {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

const write = (storage: () => Storage, key: string, value: string): void => {
  try {
    storage().setItem(key, value)
  } catch {
    // Storage unavailable; nothing to remember.
  }
}

const session = () => sessionStorage

export const getStepShownThisSession = (userId: string | number): string | null =>
  read(session, `${SESSION_PREFIX}${userId}`)

export const markStepShownThisSession = (userId: string | number, step: string): void =>
  write(session, `${SESSION_PREFIX}${userId}`, step)

/** Called on logout so the next login opens the popup again. */
export const clearOnboardingSession = (): void => {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(SESSION_PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    // Storage unavailable; nothing to clear.
  }
}
