import type { OnboardingPathConfig, OnboardingStepConfig, OnboardingStepId } from '../../config/onboardingSteps'

export type { OnboardingStepId, OnboardingStepConfig } from '../../config/onboardingSteps'
export type { ProfileOnboardingStatus } from '../profile/services'

/** The one thing to suggest to the borrower right now. */
export interface OnboardingSuggestion {
  step: OnboardingStepConfig
  /** 1-based position of the current step in the journey, for "Step 3 of 4". */
  stepNumber: number
  totalSteps: number
  /** Steps really done. Lower than stepNumber - 1 when something was skipped. */
  completedSteps: number
  /** Skipped steps still to do: a skip postpones a step, it doesn't do it. */
  pendingSteps: OnboardingStepConfig[]
  /**
   * Set once the results are really ready: the borrower chooses what they
   * are looking for. `selected` is their choice, null until they make one.
   * Null when there is nothing to choose (any other step, or the last step
   * reached by skipping).
   */
  pathChoice: { selected: OnboardingPathConfig | null } | null
}

export interface AutoOpenInput {
  /** The step the popup last opened for in this browser session, if any. */
  seenThisSession: string | null
  current: OnboardingStepId
}
