import {
  chosenPathCopy,
  FREE_TRIAL_CREDIT_PROFILE_COPY,
  ONBOARDING_FLOWS,
  ONBOARDING_PATHS,
  ONBOARDING_STEPS,
  PROFILE_SECTIONS,
} from '../../config/onboardingSteps'
import type { ProfileCompletionStatus } from '../profile/services'
import type { OnboardingStepConfig } from '../../config/onboardingSteps'
import type { AutoOpenInput, OnboardingSuggestion, ProfileOnboardingStatus } from './types'

/** The profile sections still to fill in, in Profile-tab order. */
const incompleteProfileSections = (completion: Omit<ProfileCompletionStatus, 'onboarding'>) =>
  PROFILE_SECTIONS.filter((section) => !completion[section.key].is_complete).map((section) => ({
    ...section,
    missing: completion[section.key].missing_fields.length,
  }))

/**
 * @param completion The rest of the profile completion data, when at hand: it
 *   lets the complete-profile step name the sections still to fill in.
 */
export function toOnboardingSuggestion(
  status: ProfileOnboardingStatus | null | undefined,
  completion?: Omit<ProfileCompletionStatus, 'onboarding'>
): OnboardingSuggestion | null {
  // No step yet: the borrower hasn't paid or completed their profile. And no
  // config for `completed`: the walkthrough is over, nothing to suggest.
  if (!status?.current_step) return null

  const configured = ONBOARDING_STEPS.find((s) => s.id === status.current_step)
  if (!configured) return null

  // The API only reaches the last step once the borrower's part is done; with
  // nothing to choose from, there is nothing to suggest.
  if (configured.id === 'results_ready' && status.results_ready === false) return null

  const flow = status.flow ?? 'paid'
  const journey = ONBOARDING_FLOWS[flow]

  // Nothing is still being verified once the results are ready.
  let step: OnboardingStepConfig = status.results_ready && configured.notice ? { ...configured, notice: null } : configured
  let pathChoice: OnboardingSuggestion['pathChoice'] = null
  if (configured.id === 'results_ready') {
    // Results ready: the borrower chooses where to go, then is pointed there.
    const selected = ONBOARDING_PATHS.find((path) => path.id === status.selected_path) ?? null
    pathChoice = { selected }
    // Until they choose, the choice itself is the next step: no menu item to point at.
    step = selected ? { ...configured, ...chosenPathCopy(selected) } : { ...configured, menu: null }
  } else if (configured.id === 'credit_profile' && flow === 'free_trial') {
    // The last step on this journey: nothing after it.
    step = { ...configured, ...FREE_TRIAL_CREDIT_PROFILE_COPY }
  } else if (configured.id === 'complete_profile' && completion) {
    const sections = incompleteProfileSections(completion)
    if (sections.length > 0) {
      step = {
        ...configured,
        todo: sections.map(
          (section) => `${section.name}: ${section.missing} field${section.missing === 1 ? '' : 's'} to fill in`
        ),
        route: `/profile?tab=${sections[0].tab}`,
      }
    }
  }

  const pendingSteps = (status.pending_steps ?? [])
    .map((id) => ONBOARDING_STEPS.find((s) => s.id === id))
    .filter((s): s is OnboardingStepConfig => s !== undefined)

  return {
    step,
    // Where the step sits, not how much is done: skipped steps are passed but not done.
    stepNumber: Math.min(journey.indexOf(configured.id) + 1, status.total_steps),
    totalSteps: status.total_steps,
    completedSteps: status.completed_steps,
    pendingSteps,
    pathChoice,
  }
}

/**
 * The popup opens by itself once per step per browser session (so on login,
 * and whenever the borrower moves on).
 */
export function shouldAutoOpen({ seenThisSession, current }: AutoOpenInput): boolean {
  return seenThisSession !== current
}
