import React from 'react'
import { Outlet } from 'react-router-dom'
import { useProfileCompletion } from '../../modules/profile'
import FundingLocked from '../../pages/funding/components/FundingLocked'
import FundingLoader from '../../components/Loader/FundingLoader'

/**
 * Funding opens once FCH has uploaded the borrower's credit report: without it
 * every funding criterion reads "Failed". The API decides (`funding.unlocked`
 * on the profile completion status); until it says so, the pages stay closed.
 */
export default function FundingGuard() {
  const { data: completion, isLoading } = useProfileCompletion()

  if (isLoading) {
    return <FundingLoader />
  }

  if (!completion?.funding?.unlocked) {
    return <FundingLocked creditProfileSubmitted={completion?.funding?.credit_profile_submitted ?? false} />
  }

  return <Outlet />
}
