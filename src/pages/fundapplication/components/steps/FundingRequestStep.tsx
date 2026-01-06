import React from 'react'
import type { FundingRequest } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'

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
  const isValid = !!(funding.requestedAmount && funding.purpose && funding.fundingType)

  if (loading) {
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
        <select className="form-select" value={funding.purpose} onChange={(e)=>setFunding({...funding,purpose:e.target.value})}>
          <option value="">Select purpose of funds</option>
          <option value="Working Capital">Working Capital</option>
          <option value="Equipment Purchase">Equipment Purchase</option>
          <option value="Inventory">Inventory</option>
          <option value="Marketing">Marketing</option>
          <option value="Expansion">Expansion</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label">Preferred Funding Type <span className="text-danger">*</span></label>
        <select className="form-select" value={funding.fundingType} onChange={(e)=>setFunding({...funding,fundingType:e.target.value})}>
          <option value="">Select preferred funding type</option>
          <option value="Term Loan">Term Loan</option>
          <option value="Line of Credit">Line of Credit</option>
          <option value="Equipment Financing">Equipment Financing</option>
          <option value="SBA Loan">SBA Loan</option>
          <option value="Merchant Cash Advance">Merchant Cash Advance</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Timeframe Needed</label>
        <select className="form-select" value={funding.timeframe} onChange={(e)=>setFunding({...funding,timeframe:e.target.value})}>
          <option value="">Select timeframe needed</option>
          <option value="Immediately">Immediately</option>
          <option value="1-2 Weeks">1-2 Weeks</option>
          <option value="1 Month">1 Month</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label">Collateral Available?</label>
        <select className="form-select" value={funding.collateral} onChange={(e)=>setFunding({...funding,collateral:e.target.value})}>
          <option value="">Select collateral</option>
          <option value="None">None</option>
          <option value="Business Assets">Business Assets</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Equipment">Equipment</option>
          <option value="Inventory">Inventory</option>
        </select>
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!isValid} loading={loading} />
    </form>
  )
}
