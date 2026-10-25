import { http, HttpResponse } from 'msw'
import { server } from './server'
import { useAuthStore } from '../../src/store/auth'
import type { ProfileOnboardingStatus } from '../../src/modules/profile/services'

/** Shared MSW + store setup for the Getting Started suggestion tests. */

export function signInBorrower(user: Record<string, unknown> = {}) {
  useAuthStore.setState({
    token: 't',
    user: { id: 1, ...user },
    userSubscription: { subscription_status: 'active', is_free_trail: false },
  } as never)
}

export function signOutBorrower() {
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null } as never)
}

type Step = NonNullable<ProfileOnboardingStatus['current_step']>

/** Steps really done when each is the current one, on the paid journey. */
const COMPLETED_STEPS: Record<Step, number> = {
  complete_profile: 0,
  credit_profile: 1,
  verify_all: 2,
  upload_documents: 3,
  results_ready: 4,
  completed: 5,
}

/** Steps on the paid journey (free trial: pass `{ flow: 'free_trial', total_steps: 2 }`). */
const PAID_TOTAL_STEPS = 5

/**
 * Serves GET /borrower/profile/completion with the given onboarding step.
 * Returns a counter of how many times it was asked.
 */
export function mockOnboardingStep(currentStep: Step | null, overrides: Partial<ProfileOnboardingStatus> = {}) {
  const calls = { count: 0 }
  server.use(
    http.get('*/borrower/profile/completion', () => {
      calls.count++
      // The profile is incomplete only on the step that asks for it (and, as
      // before, when the journey hasn't started).
      const profileDone = currentStep !== null && currentStep !== 'complete_profile'
      return HttpResponse.json({
        status: true,
        data: {
          is_complete: profileDone,
          // Not started: Personal has a gap. On the profile step: Business does.
          personal: { is_complete: currentStep !== null, missing_fields: currentStep !== null ? [] : ['first_name'] },
          business: {
            is_complete: currentStep !== 'complete_profile',
            missing_fields: currentStep === 'complete_profile' ? ['entity_type', 'industry_type'] : [],
          },
          financial: { is_complete: true, missing_fields: [] },
          onboarding: {
            flow: 'paid',
            current_step: currentStep,
            completed_steps: currentStep ? COMPLETED_STEPS[currentStep] : 0,
            total_steps: PAID_TOTAL_STEPS,
            results_ready: currentStep === 'results_ready' || currentStep === 'completed',
            pending_steps: [],
            ...overrides,
          },
        },
      })
    })
  )
  return calls
}

/**
 * Serves POST /borrower/profile/onboarding/complete, answering with the step
 * the API moves the borrower to; from then on the completion endpoint reports
 * that step too, as the API would. Returns a counter of how many times it was hit.
 */
export function mockCompleteOnboarding(nextStep: Step = 'completed') {
  const calls = { count: 0 }
  server.use(
    http.post('*/borrower/profile/onboarding/complete', () => {
      calls.count++
      mockOnboardingStep(nextStep)
      return HttpResponse.json({
        status: true,
        data: {
          current_step: nextStep,
          completed_steps: COMPLETED_STEPS[nextStep],
          total_steps: PAID_TOTAL_STEPS,
          results_ready: true,
          pending_steps: [],
        },
      })
    })
  )
  return calls
}

/**
 * Serves POST /borrower/profile/onboarding/skip: moves the borrower to
 * `nextStep` with the skipped step still to do (results not ready, as after a
 * real skip), and from then on the completion endpoint reports it. Records the
 * step each request asked to skip.
 */
export function mockSkipOnboarding(nextStep: Step = 'results_ready') {
  const skipped: string[] = []
  server.use(
    http.post('*/borrower/profile/onboarding/skip', async ({ request }) => {
      const body = (await request.json()) as { step: string }
      skipped.push(body.step)
      const onboarding = {
        current_step: nextStep,
        // A skip doesn't count as done.
        completed_steps: COMPLETED_STEPS[body.step as Step],
        total_steps: PAID_TOTAL_STEPS,
        results_ready: false,
        pending_steps: [body.step as Step],
      }
      mockOnboardingStep(nextStep, onboarding)
      return HttpResponse.json({ status: true, data: onboarding })
    })
  )
  return skipped
}

/**
 * Serves POST /borrower/profile/onboarding/resume: the skipped step becomes the
 * current step again, and from then on the completion endpoint reports it.
 * Records the step each request went back to.
 */
export function mockResumeOnboarding() {
  const resumed: string[] = []
  server.use(
    http.post('*/borrower/profile/onboarding/resume', async ({ request }) => {
      const body = (await request.json()) as { step: Step }
      resumed.push(body.step)
      const onboarding = {
        current_step: body.step,
        completed_steps: COMPLETED_STEPS[body.step],
        total_steps: PAID_TOTAL_STEPS,
        results_ready: false,
        pending_steps: [],
      }
      mockOnboardingStep(body.step, onboarding)
      return HttpResponse.json({ status: true, data: onboarding })
    })
  )
  return resumed
}

/**
 * Serves POST /borrower/profile/onboarding/path: saves the borrower's choice
 * once their results are ready, and from then on the completion endpoint
 * reports it. Records each path chosen.
 */
export function mockChoosePath() {
  const chosen: string[] = []
  server.use(
    http.post('*/borrower/profile/onboarding/path', async ({ request }) => {
      const body = (await request.json()) as { path: string }
      chosen.push(body.path)
      const onboarding = {
        current_step: 'results_ready' as Step,
        completed_steps: COMPLETED_STEPS.results_ready,
        total_steps: PAID_TOTAL_STEPS,
        results_ready: true,
        pending_steps: [],
        selected_path: body.path,
      }
      mockOnboardingStep('results_ready', onboarding as Partial<ProfileOnboardingStatus>)
      return HttpResponse.json({ status: true, data: onboarding })
    })
  )
  return chosen
}

/**
 * What the "What are you looking for?" choice reads its figures from: the
 * capital access estimate, the card strategies (eligible = approval_status
 * true and not completed) and the funding programs (likely eligible =
 * engine_status Active). Omit one to have its endpoint fail, as when the data
 * isn't there.
 */
export function mockResultsFigures({
  estimatedTotalAccess,
  strategies,
  fundingStatuses,
}: {
  estimatedTotalAccess?: string
  strategies?: Array<{ approval_status: boolean; isCompleted?: boolean }>
  fundingStatuses?: string[]
} = {}) {
  server.use(
    http.get('*/borrower/capital-access/overview', () =>
      estimatedTotalAccess === undefined
        ? HttpResponse.json({ status: false, message: 'Not available' }, { status: 404 })
        : HttpResponse.json({ status: true, data: { readiness_score: 84, readiness_status: 'Executive Ready', factors: [], estimated_total_access: estimatedTotalAccess } })
    ),
    http.get('*/borrower/capital-access/strategies-list', () =>
      strategies === undefined
        ? HttpResponse.json({ status: false, message: 'Not available' }, { status: 404 })
        : HttpResponse.json({
            status: true,
            data: strategies.map((s, i) => ({ id: i + 1, name: `Strategy ${i + 1}`, approval_status: s.approval_status, isCompleted: s.isCompleted ?? false })),
          })
    ),
    http.get('*/borrower/funding', () =>
      fundingStatuses === undefined
        ? HttpResponse.json({ status: false, message: 'Not available' }, { status: 404 })
        : HttpResponse.json({
            status: true,
            data: { groups: [{ sequencings: fundingStatuses.map((engine_status, i) => ({ id: i + 1, engine_status })) }], types: [], stats: {} },
          })
    )
  )
}
