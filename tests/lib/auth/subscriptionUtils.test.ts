import { describe, expect, it } from 'vitest'
import { isSubscriptionRestricted, isFreeTrialLocked } from '../../../src/lib/auth/subscriptionUtils'
import { PARTNER_TYPES, SUBSCRIPTION_STATUS_TYPES } from '../../../src/config/partnerTypeOptions'
import type { UserSubscription } from '../../../src/store/auth'

const futureDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

const pastDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

describe('isSubscriptionRestricted', () => {
  it('is false when there is no subscription', () => {
    expect(isSubscriptionRestricted(null)).toBe(false)
    expect(isSubscriptionRestricted(undefined)).toBe(false)
  })

  it('is false for hosts, even with an inactive status', () => {
    expect(isSubscriptionRestricted({ is_host: true, subscription_status: 'Expired' } as UserSubscription)).toBe(false)
  })

  it('is false while on a free trial, regardless of status', () => {
    expect(isSubscriptionRestricted({ is_free_trail: true, subscription_status: 'Expired' } as UserSubscription)).toBe(false)
  })

  it('is true for a White-Label/Certified partner who has not paid their enrollment fee', () => {
    expect(
      isSubscriptionRestricted({
        partner_type: PARTNER_TYPES.WHITE_LABEL,
        partner_payment_for_me: false,
      } as UserSubscription)
    ).toBe(true)

    expect(
      isSubscriptionRestricted({
        partner_type: PARTNER_TYPES.CERTIFIED,
        partner_payment_for_me: false,
      } as UserSubscription)
    ).toBe(true)
  })

  it('is false for a White-Label partner whose enrollment fee is paid, with an active subscription', () => {
    expect(
      isSubscriptionRestricted({
        partner_type: PARTNER_TYPES.WHITE_LABEL,
        partner_payment_for_me: true,
        subscription_status: SUBSCRIPTION_STATUS_TYPES.ACTIVE,
      } as UserSubscription)
    ).toBe(false)
  })

  it('is true when the subscription status is present and not active', () => {
    expect(isSubscriptionRestricted({ subscription_status: 'Cancelled' } as UserSubscription)).toBe(true)
  })

  it('is false when status is active and there is no end date', () => {
    expect(
      isSubscriptionRestricted({
        subscription_status: SUBSCRIPTION_STATUS_TYPES.ACTIVE,
        subscription_end_date: null,
      } as UserSubscription)
    ).toBe(false)
  })

  it('is false when status is active and the end date is in the future', () => {
    expect(
      isSubscriptionRestricted({
        subscription_status: SUBSCRIPTION_STATUS_TYPES.ACTIVE,
        subscription_end_date: futureDate(),
      } as UserSubscription)
    ).toBe(false)
  })

  it('is true when status is active but the end date has passed', () => {
    expect(
      isSubscriptionRestricted({
        subscription_status: SUBSCRIPTION_STATUS_TYPES.ACTIVE,
        subscription_end_date: pastDate(),
      } as UserSubscription)
    ).toBe(true)
  })
})

describe('isFreeTrialLocked', () => {
  it('mirrors the is_free_trail flag', () => {
    expect(isFreeTrialLocked({ is_free_trail: true } as UserSubscription)).toBe(true)
    expect(isFreeTrialLocked({ is_free_trail: false } as UserSubscription)).toBe(false)
    expect(isFreeTrialLocked(null)).toBe(false)
    expect(isFreeTrialLocked(undefined)).toBe(false)
  })
})
