import React from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import type { FinancialInfo } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CustomDropdown from '../shared/CustomDropdown'
import { selfReportedCreditScoreOptions } from '../../../../data/profile'
import { useFinancialInfo } from '../../../../modules/funding-application/queries'

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
  const { data: apiData, isLoading: isApiLoading, isSuccess } = useFinancialInfo()

  // Pre-fill form from API
  React.useEffect(() => {
    if (isSuccess && apiData) {
      setFinancial({
        ...financial,
        monthlyRevenue: apiData.monthly_revenue || financial.monthlyRevenue,
        annualRevenue: apiData.annual_revenue || financial.annualRevenue,
        bankName: apiData.business_bank_name || financial.bankName,
        checkingStartDate: apiData.business_checking_start_date || financial.checkingStartDate,
        personalCreditScore: apiData.self_reported_personal_credit_score || financial.personalCreditScore,
        businessCreditScore: apiData.self_reported_business_credit_score || financial.businessCreditScore,
        existingDebt: apiData.has_business_debt,
        debtBalance: apiData.debt_balance || financial.debtBalance,
      })
    }
  }, [isSuccess, apiData])

  const baseOk = !!(financial.monthlyRevenue && financial.checkingStartDate && financial.personalCreditScore)
  const debtOk = !financial.existingDebt || !!financial.debtBalance
  const isValid = baseOk && debtOk

  if (loading || isApiLoading) {
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
        <Flatpickr
          className="form-control"
          value={financial.checkingStartDate}
          onChange={(dates, dateStr) => {
            setFinancial({ ...financial, checkingStartDate: dateStr })
          }}
          options={{
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "m-d-Y",
            maxDate: "today",
          }}
          placeholder="Select start date"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Self-Reported Personal Credit Score <span className="text-danger">*</span></label>
        <CustomDropdown
          value={financial.personalCreditScore}
          onChange={(value) => setFinancial({ ...financial, personalCreditScore: value })}
          options={selfReportedCreditScoreOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select self-reported personal credit score"
          className="w-100"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Self-Reported Business Credit Score</label>
        <CustomDropdown
          value={financial.businessCreditScore}
          onChange={(value) => setFinancial({ ...financial, businessCreditScore: value })}
          options={selfReportedCreditScoreOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select self-reported business credit score"
          className="w-100"
        />
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

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!isValid} loading={loading || isApiLoading} />
    </form>
  )
}
