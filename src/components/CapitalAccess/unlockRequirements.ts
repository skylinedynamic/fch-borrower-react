import type { ProfileCompletionStatus } from '../../modules/profile/services'

export type UnlockRequirementState = 'done' | 'current' | 'upcoming'

export interface UnlockRequirement {
  id: 'profile' | 'credit_profile' | 'tier_0' | 'verification'
  title: string
  text: string
  state: UnlockRequirementState
  /** Where to go for it; none while it is our team's turn. */
  action?: { label: string; route: string }
}

/** The walkthrough steps that come before Credit Card Stacking can open, in order. */
const STEPS_BEFORE_VERIFICATION = ['complete_profile', 'credit_profile', 'verify_all'] as const

/**
 * What stands between the borrower and Credit Card Stacking, for the locked
 * screen: the profile, the credit profile and Tier 0 are theirs to do, then
 * our team verifies them. Worked out from the Getting Started step.
 */
export function buildUnlockRequirements(completion: ProfileCompletionStatus | null | undefined): UnlockRequirement[] {
  const step = completion?.onboarding?.current_step
  // How many of the borrower's own three are done: from the walkthrough step
  // when there is one, else (not started, or still loading) from the profile alone.
  let done: number
  if (step) {
    const index = (STEPS_BEFORE_VERIFICATION as readonly string[]).indexOf(step)
    done = index === -1 ? STEPS_BEFORE_VERIFICATION.length : index
  } else {
    done = completion?.is_complete ? 1 : 0
  }

  const mine: Omit<UnlockRequirement, 'state'>[] = [
    {
      id: 'profile',
      title: 'Complete your profile',
      text: 'Personal information, business details and financial details.',
      action: { label: 'Complete profile', route: '/profile' },
    },
    {
      id: 'credit_profile',
      title: 'Submit your credit profile',
      text: 'A soft credit check that never impacts your credit score.',
      action: { label: 'Fill Credit Profile', route: '/profile?tab=3' },
    },
    {
      id: 'tier_0',
      title: 'Verify your Tier 0 tasks',
      text: 'Click Verify All on the Step-By-Step Guide to send them to our team.',
      action: { label: 'Open Step by Step Guide', route: '/credit-builder/guide' },
    },
  ]

  const requirements: UnlockRequirement[] = mine.map((requirement, index) => ({
    ...requirement,
    state: index < done ? 'done' : index === done ? 'current' : 'upcoming',
    // Only the one to do now points anywhere.
    action: index === done ? requirement.action : undefined,
  }))

  requirements.push({
    id: 'verification',
    title: 'Verified by our team',
    text:
      done >= mine.length
        ? 'Our team is verifying your Tier 0 tasks and credit profile. Credit Card Stacking opens as soon as they are verified.'
        : 'Once the steps above are done, our team verifies them and Credit Card Stacking opens.',
    state: done >= mine.length ? 'current' : 'upcoming',
  })

  return requirements
}
