import React from 'react'
import type { FinancialInfo } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'

type FinancialInformationStepProps = {
  financial: FinancialInfo
  setFinancial: (data: FinancialInfo) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export default function FinancialInformationStep({
  financial,
  setFinancial,
  onNext,
  onBack,
  loading,
}: FinancialInformationStepProps) {
  const baseOk = !!(financial.monthlyRevenue && financial.checkingStartDate && financial.personalCreditScore)
  const debtOk = !financial.existingDebt || !!financial.debtBalance
  const isValid = baseOk && debtOk

  if (loading) {
    return <FormSkeleton fieldCount={6} />
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
        <input type="number" className="form-control" placeholder="Enter monthly revenue" value={financial.monthlyRevenue} onChange={(e)=>setFinancial({...financial,monthlyRevenue:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Annual Revenue</label>
        <input type="number" className="form-control" placeholder="Enter annual revenue" value={financial.annualRevenue} onChange={(e)=>setFinancial({...financial,annualRevenue:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">Business Bank Name</label>
        <input type="text" className="form-control" placeholder="Enter business bank name" value={financial.bankName} onChange={(e)=>setFinancial({...financial,bankName:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Business Checking Start Date <span className="text-danger">*</span></label>
        <input type="date" className="form-control" value={financial.checkingStartDate} onChange={(e)=>setFinancial({...financial,checkingStartDate:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">Self-Reported Personal Credit Score <span className="text-danger">*</span></label>
        <select className="form-select" value={financial.personalCreditScore} onChange={(e)=>setFinancial({...financial,personalCreditScore:e.target.value})}>
          <option value="">Select self-reported personal credit score</option>
          <option value="Below 600">Below 600</option>
          <option value="600-649">600-649</option>
          <option value="650-699">650-699</option>
          <option value="700-749">700-749</option>
          <option value="750+">750+</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Self-Reported Business Credit Score</label>
        <select className="form-select" value={financial.businessCreditScore} onChange={(e)=>setFinancial({...financial,businessCreditScore:e.target.value})}>
          <option value="">Select self-reported business credit score</option>
          <option value="Below 600">Below 600</option>
          <option value="600-649">600-649</option>
          <option value="650-699">650-699</option>
          <option value="700-749">700-749</option>
          <option value="750+">750+</option>
        </select>
      </div>

      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label me-3 mb-0">Existing Business Debt?</label>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="radio" name="existingDebt" id="existingDebtYes" checked={financial.existingDebt === true} onChange={()=>setFinancial({...financial,existingDebt:true})} />
          <label className="form-check-label" htmlFor="existingDebtYes">Yes</label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="radio" name="existingDebt" id="existingDebtNo" checked={financial.existingDebt === false} onChange={()=>setFinancial({...financial,existingDebt:false,debtBalance:''})} />
          <label className="form-check-label" htmlFor="existingDebtNo">No</label>
        </div>
      </div>

      {financial.existingDebt && (
        <div className="col-12">
          <label className="form-label">Debt Balance (if yes)</label>
          <input type="number" className="form-control" placeholder="Enter Debt Balance" value={financial.debtBalance} onChange={(e)=>setFinancial({...financial,debtBalance:e.target.value})} />
        </div>
      )}

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!isValid} loading={loading} />
    </form>
  )
}
