import { describe, expect, it } from 'vitest'
import { shouldAutoOpen, toOnboardingSuggestion } from '../../../src/modules/onboarding/progress'
import type { ProfileOnboardingStatus } from '../../../src/modules/profile/services'

const status = (overrides: Partial<ProfileOnboardingStatus> = {}): ProfileOnboardingStatus => ({
  current_step: 'upload_documents',
  completed_steps: 3,
  total_steps: 5,
  ...overrides,
})

describe('toOnboardingSuggestion', () => {
  it('turns the API step into the suggestion to show, numbered from 1', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'credit_profile', completed_steps: 1 }))).toMatchObject({
      stepNumber: 2,
      totalSteps: 5,
      step: { id: 'credit_profile', route: '/profile?tab=3', ctaLabel: 'Fill Credit Profile' },
    })
  })

  it.each([
    ['complete_profile', '/profile'],
    ['credit_profile', '/profile?tab=3'],
    ['upload_documents', '/documents'],
    ['verify_all', '/credit-builder/guide'],
    ['results_ready', '/credit-card-stacking'],
  ] as const)('sends the %s step to %s', (currentStep, route) => {
    expect(toOnboardingSuggestion(status({ current_step: currentStep }))?.step.route).toBe(route)
  })

  it('has no review step: an old "in_review" from the API suggests nothing', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'in_review' as never }))).toBeNull()
  })

  it('suggests nothing on the last step if the results are not ready', () => {
    // The API doesn't report this any more (the last step comes once the
    // borrower's part is done), but there would be nothing to choose from.
    expect(toOnboardingSuggestion(status({ current_step: 'results_ready', completed_steps: 4, results_ready: false }))).toBeNull()
  })

  it('shows the last step once the results are ready', () => {
    const suggestion = toOnboardingSuggestion(status({ current_step: 'results_ready', completed_steps: 4, results_ready: true }))
    expect(suggestion?.step.id).toBe('results_ready')
    expect(suggestion?.pathChoice).toEqual({ selected: null })
  })

  it('numbers a step by where it sits in the journey, not by how much is really done', () => {
    // Reached the last step by skipping: only the profile, credit profile and documents are done.
    const suggestion = toOnboardingSuggestion(
      status({ current_step: 'results_ready', completed_steps: 3, pending_steps: ['verify_all'] })
    )
    expect(suggestion?.stepNumber).toBe(5)
    expect(suggestion?.completedSteps).toBe(3)
  })

  it('lists the skipped steps still to do', () => {
    const suggestion = toOnboardingSuggestion(
      status({ current_step: 'results_ready', completed_steps: 1, pending_steps: ['verify_all', 'unknown' as never] })
    )
    expect(suggestion?.pendingSteps.map((step) => step.id)).toEqual(['verify_all'])
  })

  it('has nothing still to do when the API sends no list', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'upload_documents' }))?.pendingSteps).toEqual([])
  })

  it('numbers the last step 5 of 5', () => {
    const suggestion = toOnboardingSuggestion(status({ current_step: 'results_ready', completed_steps: 4 }))
    expect(suggestion?.stepNumber).toBe(5)
    expect(suggestion?.totalSteps).toBe(5)
  })

  it('puts Verify All third and documents fourth, after the credit profile', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'verify_all', completed_steps: 2 }))?.stepNumber).toBe(3)
    expect(toOnboardingSuggestion(status({ current_step: 'upload_documents', completed_steps: 3 }))?.stepNumber).toBe(4)
  })

  it('says the results are ready on the last step when they are, and offers the choice of path', () => {
    const suggestion = toOnboardingSuggestion(status({ current_step: 'results_ready', completed_steps: 3, results_ready: true }))
    expect(suggestion?.step.title).toBe('Your results are ready')
    expect(suggestion?.pathChoice).toEqual({ selected: null })
    // The borrower picks the destination, so no menu item is pointed at yet.
    expect(suggestion?.step.menu).toBeNull()
  })

  it('points to the page of the path the borrower chose', () => {
    const suggestion = toOnboardingSuggestion(
      status({ current_step: 'results_ready', completed_steps: 4, results_ready: true, selected_path: 'single_card' })
    )
    expect(suggestion?.pathChoice?.selected?.id).toBe('single_card')
    expect(suggestion?.step.title).toBe('Go to Credit Accounts')
    expect(suggestion?.step.route).toBe('/credit-builder/credit-accounts')
    expect(suggestion?.step.ctaLabel).toBe('Go to Credit Accounts')
    expect(suggestion?.step.menu).toEqual({ target: '/credit-builder/credit-accounts', tag: 'Go to Credit Accounts' })
    // What to do there is the chosen page's own, not a generic list.
    expect(suggestion?.step.todo).toContain('Look through the cards matched to your profile')
    expect(suggestion?.step.description).toBe('Your choice: A single business credit card. Open Credit Accounts to take the next step.')
  })

  it('offers no choice of path on any other step', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'verify_all', completed_steps: 2 }))?.pathChoice).toBeNull()
  })

  it.each([
    ['verify_all', false],
    ['credit_profile', false],
    ['upload_documents', false],
    ['results_ready', false],
  ] as const)('lets the %s step be skipped: %s', (currentStep, skippable) => {
    expect(toOnboardingSuggestion(status({ current_step: currentStep }))?.step.skippable).toBe(skippable)
  })

  it.each([
    ['paid', {}],
    ['free-trial', { flow: 'free_trial', total_steps: 2 }],
  ] as const)('lists only what the credit profile really unlocks on the %s journey', (_journey, overrides) => {
    // "Soft check" is a fact about the check (the description says so), not something it unlocks.
    const unlocks = toOnboardingSuggestion(status({ current_step: 'credit_profile', completed_steps: 1, ...overrides }))?.step.unlocks
    expect(unlocks?.map((u) => u.title).join(' ')).not.toMatch(/soft check/i)
    expect(unlocks?.map((u) => u.title)).toContain('Your readiness score')
  })

  describe('the free-trial journey', () => {
    const freeTrial = (overrides: Partial<ProfileOnboardingStatus> = {}) =>
      status({ flow: 'free_trial', total_steps: 2, ...overrides })

    it.each([
      ['complete_profile', '/profile', 1],
      ['credit_profile', '/profile?tab=3', 2],
    ] as const)('puts %s at %s, step %i of 2', (currentStep, route, stepNumber) => {
      const suggestion = toOnboardingSuggestion(freeTrial({ current_step: currentStep, completed_steps: stepNumber - 1 }))
      expect(suggestion?.step.route).toBe(route)
      expect(suggestion?.stepNumber).toBe(stepNumber)
      expect(suggestion?.totalSteps).toBe(2)
    })

    it('says the credit profile is the last thing to do: no Tier 0, no documents', () => {
      const step = toOnboardingSuggestion(freeTrial({ current_step: 'credit_profile', completed_steps: 1 }))?.step
      expect(JSON.stringify(step)).not.toMatch(/tier 0|documents/i)
    })

    it('suggests nothing once the credit profile is in', () => {
      expect(toOnboardingSuggestion(freeTrial({ current_step: 'completed', completed_steps: 2 }))).toBeNull()
    })
  })

  describe('the complete-profile step', () => {
    const completion = {
      is_complete: false,
      personal: { is_complete: true, missing_fields: [] },
      business: { is_complete: false, missing_fields: ['entity_type', 'industry_type'] },
      financial: { is_complete: false, missing_fields: ['monthly_revenue'] },
    }

    it('lists the sections still to fill in, with how many fields each needs', () => {
      const step = toOnboardingSuggestion(status({ current_step: 'complete_profile', completed_steps: 0 }), completion)?.step
      expect(step?.todo).toEqual(['Business Details: 2 fields to fill in', 'Financial: 1 field to fill in'])
    })

    it('opens the profile on the first section still to fill in', () => {
      const step = toOnboardingSuggestion(status({ current_step: 'complete_profile', completed_steps: 0 }), completion)?.step
      expect(step?.route).toBe('/profile?tab=1')
    })

    it('points the menu arrow at Profile', () => {
      expect(toOnboardingSuggestion(status({ current_step: 'complete_profile' }))?.step.menu?.target).toBe('/profile')
    })

    it('cannot be skipped', () => {
      expect(toOnboardingSuggestion(status({ current_step: 'complete_profile' }))?.step.skippable).toBe(false)
    })
  })

  it('has nothing more to suggest once the borrower has reached Credit Card Stacking', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'completed', completed_steps: 4 }))).toBeNull()
  })

  it('has nothing to suggest before the journey starts (not paid, or profile incomplete)', () => {
    // Paying and completing the profile have their own prompts.
    expect(toOnboardingSuggestion(status({ current_step: null, completed_steps: 0 }))).toBeNull()
  })

  it('has no payment or profile step', () => {
    expect(toOnboardingSuggestion(status({ current_step: 'payment' as never }))).toBeNull()
    expect(toOnboardingSuggestion(status({ current_step: 'profile' as never }))).toBeNull()
  })

  it('has nothing to suggest when the API sent no step, or one it does not know', () => {
    expect(toOnboardingSuggestion(undefined)).toBeNull()
    expect(toOnboardingSuggestion(status({ current_step: 'something-new' as never }))).toBeNull()
  })
})

describe('shouldAutoOpen', () => {
  it('opens the first time a step is seen in this session', () => {
    expect(shouldAutoOpen({ seenThisSession: null, current: 'credit_profile' })).toBe(true)
  })

  it('opens again when the borrower reaches a new step', () => {
    expect(shouldAutoOpen({ seenThisSession: 'credit_profile', current: 'verify_all' })).toBe(true)
  })

  it('stays closed for a step already shown this session', () => {
    expect(shouldAutoOpen({ seenThisSession: 'verify_all', current: 'verify_all' })).toBe(false)
  })
})
