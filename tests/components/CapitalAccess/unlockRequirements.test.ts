import { describe, expect, it } from 'vitest'
import { buildUnlockRequirements } from '../../../src/components/CapitalAccess/unlockRequirements'
import type { ProfileCompletionStatus } from '../../../src/modules/profile/services'

const completion = (current_step: string | null, isComplete = true): ProfileCompletionStatus =>
  ({
    is_complete: isComplete,
    personal: { is_complete: isComplete, missing_fields: [] },
    business: { is_complete: isComplete, missing_fields: [] },
    financial: { is_complete: isComplete, missing_fields: [] },
    onboarding: { flow: 'paid', current_step, completed_steps: 0, total_steps: 5, results_ready: false, pending_steps: [] },
  }) as ProfileCompletionStatus

const states = (c: ProfileCompletionStatus | null) => buildUnlockRequirements(c).map((r) => `${r.id}:${r.state}`)

describe('buildUnlockRequirements', () => {
  it('starts with the profile when it is not complete, pointing at it', () => {
    const list = buildUnlockRequirements(completion('complete_profile', false))
    expect(states(completion('complete_profile', false))).toEqual([
      'profile:current',
      'credit_profile:upcoming',
      'tier_0:upcoming',
      'verification:upcoming',
    ])
    expect(list[0].action).toEqual({ label: 'Complete profile', route: '/profile' })
  })

  it('moves on to the credit profile, then Tier 0, as each is done', () => {
    expect(states(completion('credit_profile'))).toEqual(['profile:done', 'credit_profile:current', 'tier_0:upcoming', 'verification:upcoming'])
    expect(buildUnlockRequirements(completion('credit_profile'))[1].action?.route).toBe('/profile?tab=3')
    expect(states(completion('verify_all'))).toEqual(['profile:done', 'credit_profile:done', 'tier_0:current', 'verification:upcoming'])
    expect(buildUnlockRequirements(completion('verify_all'))[2].action?.route).toBe('/credit-builder/guide')
  })

  it('waits on our team once everything the borrower can do is done', () => {
    for (const step of ['upload_documents', 'results_ready']) {
      const list = buildUnlockRequirements(completion(step))
      expect(states(completion(step))).toEqual(['profile:done', 'credit_profile:done', 'tier_0:done', 'verification:current'])
      expect(list[3].action).toBeUndefined()
    }
  })

  it('goes by the profile alone before the walkthrough has started', () => {
    expect(states(completion(null, true))[0]).toBe('profile:current'.replace('current', 'done'))
    expect(states(completion(null, false))[0]).toBe('profile:current')
  })

  it('still lists the requirements, all to do, while the status is loading', () => {
    expect(states(null)).toEqual(['profile:current', 'credit_profile:upcoming', 'tier_0:upcoming', 'verification:upcoming'])
  })
})
