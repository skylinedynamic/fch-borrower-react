import type { ProfileOnboardingStatus } from '../../modules/profile/services'

/** The Profile page's tabs, in order (also the `?tab=` value). */
export const PROFILE_TAB = {
  PERSONAL: 0,
  BUSINESS: 1,
  FINANCIAL: 2,
  CREDIT_PROFILE: 3,
} as const

export type ProfileTab = (typeof PROFILE_TAB)[keyof typeof PROFILE_TAB]

/** Which of the Profile page's sections are complete. */
export interface ProfileSectionsDone {
  personal: boolean
  business: boolean
  financial: boolean
  creditProfile: boolean
}

const TAB_ORDER: { tab: ProfileTab; section: keyof ProfileSectionsDone }[] = [
  { tab: PROFILE_TAB.PERSONAL, section: 'personal' },
  { tab: PROFILE_TAB.BUSINESS, section: 'business' },
  { tab: PROFILE_TAB.FINANCIAL, section: 'financial' },
  { tab: PROFILE_TAB.CREDIT_PROFILE, section: 'creditProfile' },
]

/**
 * Where to take the borrower after saving a section: the next section still to
 * complete, in tab order, coming back round to an earlier one left incomplete.
 * Null - stay where they are - while the section just saved is still
 * incomplete, or once there is nothing left to complete.
 */
export function nextProfileTab(saved: ProfileTab, done: ProfileSectionsDone): ProfileTab | null {
  const savedIndex = TAB_ORDER.findIndex((t) => t.tab === saved)
  if (!done[TAB_ORDER[savedIndex].section]) return null

  for (let offset = 1; offset < TAB_ORDER.length; offset++) {
    const candidate = TAB_ORDER[(savedIndex + offset) % TAB_ORDER.length]
    if (!done[candidate.section]) return candidate.tab
  }
  return null
}

/**
 * Whether the credit profile has been submitted, from the walkthrough step:
 * still to do while the walkthrough is on the profile or the credit profile.
 * Before a paid walkthrough starts (no step), a verified credit profile is all
 * there is to go by.
 */
export function isCreditProfileDone(
  currentStep: ProfileOnboardingStatus['current_step'] | undefined,
  creditProfileUpdated: boolean
): boolean {
  if (!currentStep) return creditProfileUpdated
  return currentStep !== 'complete_profile' && currentStep !== 'credit_profile'
}
