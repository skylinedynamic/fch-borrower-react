import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useProfileCompletion } from '../../modules/profile'
import CapitalAccessLocked from '../../components/CapitalAccess/CapitalAccessLocked'
import CapitalAccessLockedLoader from '../../components/Loader/CapitalAccessLockedLoader'
import CapitalAccessOverviewLoader from '../../components/Loader/CapitalAccessOverviewLoader'
import { rememberCreditCardStackingUnlocked, wasCreditCardStackingUnlocked } from './creditCardStackingHint'

/**
 * Credit Card Stacking opens once the credit profile is verified (with its
 * iSoftPull report) and Tier 0 is complete. The API decides; the user's
 * `credit_profile_updated` flag alone is not enough, since submitting the
 * credit profile form sets it.
 */
export default function CapitalAccessGuard() {
  const userId = useAuthStore((state) => state.user?.id)
  const { data: completion, isLoading } = useProfileCompletion()
  const unlocked = completion?.credit_card_stacking?.unlocked

  // Remembered only to pick the right skeleton next time.
  useEffect(() => {
    if (userId != null && unlocked !== undefined) rememberCreditCardStackingUnlocked(userId, unlocked)
  }, [userId, unlocked])

  // Only on the first load (the status is fetched on every page, so it is
  // usually in hand already): look like what the borrower saw last time.
  if (isLoading) {
    return wasCreditCardStackingUnlocked(userId) ? <CapitalAccessOverviewLoader /> : <CapitalAccessLockedLoader />
  }

  if (!unlocked) {
    return <CapitalAccessLocked />
  }

  return <Outlet />
}
