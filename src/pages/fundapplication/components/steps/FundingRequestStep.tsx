import React from 'react'
import type { FundingRequest } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CustomDropdown from '../shared/CustomDropdown'
import { purposeOfFundingOptions, fundingTypeOptions, timeframeOptions, collateralOptions } from '../../../../data/profile'

import { useFundingRequest } from '../../../../modules/funding-application/queries'
import { useEffect } from 'react'

type FundingRequestStepProps = {
  funding: FundingRequest
  setFunding: (data: FundingRequest) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export default function FundingRequestStep({
  funding,
  setFunding,
  onNext,
  onBack,
  loading,
}: FundingRequestStepProps) {
  const { data: apiData, isLoading: isApiLoading, isSuccess } = useFundingRequest()

  useEffect(() => {
    if (isSuccess && apiData) {
      setFunding({
        ...funding,
        requestedAmount: apiData.requested_amount || '',
        purpose: apiData.purpose_of_funds || '',
        fundingType: apiData.preferred_funding_type || '',
        timeframe: apiData.timeframe_needed || '',
        collateral: apiData.collateral_available || '',
      })
    }
  }, [isSuccess, apiData])

  const isValid = !!(funding.requestedAmount && funding.purpose && funding.fundingType)

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={5} />
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Requested Amount <span className="text-danger">*</span></label>
        <input type="number" className="form-control" placeholder="Enter requested amount" value={funding.requestedAmount} onChange={(e)=>setFunding({...funding,requestedAmount:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Purpose of Funds <span className="text-danger">*</span></label>
        <CustomDropdown
          value={funding.purpose}
          onChange={(value) => setFunding({ ...funding, purpose: value })}
          options={purposeOfFundingOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select purpose of funds"
          className="w-100"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Preferred Funding Type <span className="text-danger">*</span></label>
        <CustomDropdown
          value={funding.fundingType}
          onChange={(value) => setFunding({ ...funding, fundingType: value })}
          options={fundingTypeOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select preferred funding type"
          className="w-100"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Timeframe Needed</label>
        <CustomDropdown
          value={funding.timeframe}
          onChange={(value) => setFunding({ ...funding, timeframe: value })}
          options={timeframeOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select timeframe needed"
          className="w-100"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Collateral Available?</label>
        <CustomDropdown
          value={funding.collateral}
          onChange={(value) => setFunding({ ...funding, collateral: value })}
          options={collateralOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select collateral"
          className="w-100"
        />
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!isValid} loading={loading || isApiLoading} />
    </form>
  )
}
