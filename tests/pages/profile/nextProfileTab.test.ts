import { describe, expect, it } from 'vitest'
import { isCreditProfileDone, nextProfileTab, PROFILE_TAB } from '../../../src/pages/profile/nextProfileTab'

const allDone = { personal: true, business: true, financial: true, creditProfile: true }

describe('nextProfileTab', () => {
  it('goes on to the next section still to complete, in tab order', () => {
    expect(nextProfileTab(PROFILE_TAB.PERSONAL, { ...allDone, business: false, financial: false })).toBe(PROFILE_TAB.BUSINESS)
    expect(nextProfileTab(PROFILE_TAB.BUSINESS, { ...allDone, financial: false })).toBe(PROFILE_TAB.FINANCIAL)
    expect(nextProfileTab(PROFILE_TAB.FINANCIAL, { ...allDone, creditProfile: false })).toBe(PROFILE_TAB.CREDIT_PROFILE)
  })

  it('skips sections already complete', () => {
    // Business is done: straight from Personal to Financial, or to the credit profile.
    expect(nextProfileTab(PROFILE_TAB.PERSONAL, { ...allDone, financial: false })).toBe(PROFILE_TAB.FINANCIAL)
    expect(nextProfileTab(PROFILE_TAB.PERSONAL, { ...allDone, creditProfile: false })).toBe(PROFILE_TAB.CREDIT_PROFILE)
  })

  it('comes back round to an earlier section left incomplete', () => {
    expect(nextProfileTab(PROFILE_TAB.FINANCIAL, { ...allDone, personal: false })).toBe(PROFILE_TAB.PERSONAL)
  })

  it('stays put while the section just saved is still incomplete', () => {
    expect(nextProfileTab(PROFILE_TAB.PERSONAL, { ...allDone, personal: false, business: false })).toBeNull()
  })

  it('stays put once everything is complete', () => {
    expect(nextProfileTab(PROFILE_TAB.BUSINESS, allDone)).toBeNull()
  })
})

describe('isCreditProfileDone', () => {
  it('is not done while the walkthrough still has the profile or the credit profile to do', () => {
    expect(isCreditProfileDone('complete_profile', false)).toBe(false)
    expect(isCreditProfileDone('credit_profile', false)).toBe(false)
  })

  it('is done once the walkthrough is past it', () => {
    expect(isCreditProfileDone('verify_all', false)).toBe(true)
    expect(isCreditProfileDone('completed', false)).toBe(true)
  })

  it('goes by the verified credit profile when there is no walkthrough step (not paid yet)', () => {
    expect(isCreditProfileDone(null, false)).toBe(false)
    expect(isCreditProfileDone(null, true)).toBe(true)
  })
})
