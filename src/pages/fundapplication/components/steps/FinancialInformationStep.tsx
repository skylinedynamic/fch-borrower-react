import React, { useState, useEffect, useCallback } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import type { FinancialInfo } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CustomDropdown from '../../../../components/Common/CustomDropdown'
import { selfReportedCreditScoreOptions, selfReportedBusinessCreditScoreOptions } from '../../../../data/profile'
import { useFinancialInfo, useSaveFinancialInfo } from '../../../../modules/funding-application/queries'
import { toast } from 'react-toastify'

interface FinancialInformationStepProps {
  financial: FinancialInfo
  setFinancial: (data: FinancialInfo) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
  onRegisterSave?: (fn: (() => Promise<boolean>) | null) => void
}

export default function FinancialInformationStep({
  financial,
  setFinancial,
  onNext,
  onBack,
  loading,
  onRegisterSave,
}: FinancialInformationStepProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { data: apiData, isLoading: isApiLoading, isSuccess } = useFinancialInfo()
  const { mutateAsync: saveFinancialInfo, isPending: isSaving } = useSaveFinancialInfo()

  // Memoized save handler
  const handleSave = useCallback(async (): Promise<boolean> => {
    setValidationErrors({})

    const payload = {
      id: financial.id || null,
      monthly_revenue: financial.monthlyRevenue,
      annual_revenue: financial.annualRevenue,
      business_bank_name: financial.bankName,
      business_checking_start_date: financial.checkingStartDate,
      self_reported_personal_credit_score: financial.personalCreditScore,
      self_reported_business_credit_score: financial.businessCreditScore,
      has_business_debt: financial.existingDebt,
      debt_balance: financial.debtBalance,
    }

    try {
      await saveFinancialInfo(payload)
      return true
    } catch (error: any) {
      const errors = error.response?.data?.errors
      if (errors) {
        setValidationErrors(errors)
      } else {
        toast.error(error.response?.data?.message || 'Failed to save financial information. Please try again.')
      }
      return false
    }
  }, [financial, saveFinancialInfo])

  // Register save function
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(handleSave)
    }
    return () => {
      if (onRegisterSave) onRegisterSave(null)
    }
  }, [onRegisterSave, handleSave])

  // Pre-fill form from API
  useEffect(() => {
    if (isSuccess && apiData) {
      setFinancial({
        ...financial,
        id: apiData.id || null,
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
  }, [isSuccess, apiData, setFinancial])

  // Helper to get field error
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  // Helper to check if field has error
  const hasError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName]
  }

  const handleNext = async () => {
    const success = await handleSave()
    if (success) {
      onNext()
    }
  }

  const baseOk = !!(financial.monthlyRevenue && financial.checkingStartDate && financial.personalCreditScore)
  const debtOk = !financial.existingDebt || !!financial.debtBalance
  const isValid = baseOk && debtOk

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={6} />
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">
          Monthly Revenue <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          className={`form-control ${hasError('monthly_revenue') ? 'is-invalid' : ''}`}
          placeholder="Enter monthly revenue"
          value={financial.monthlyRevenue}
          onChange={(e) => setFinancial({ ...financial, monthlyRevenue: e.target.value })}
        />
        {hasError('monthly_revenue') && <div className="invalid-feedback">{getFieldError('monthly_revenue')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Annual Revenue</label>
        <input
          type="number"
          className={`form-control ${hasError('annual_revenue') ? 'is-invalid' : ''}`}
          placeholder="Enter annual revenue"
          value={financial.annualRevenue}
          onChange={(e) => setFinancial({ ...financial, annualRevenue: e.target.value })}
        />
        {hasError('annual_revenue') && <div className="invalid-feedback">{getFieldError('annual_revenue')}</div>}
      </div>

      <div className="col-md-6">
        <label className="form-label">Business Bank Name</label>
        <input
          type="text"
          className={`form-control ${hasError('business_bank_name') ? 'is-invalid' : ''}`}
          placeholder="Enter business bank name"
          value={financial.bankName}
          onChange={(e) => setFinancial({ ...financial, bankName: e.target.value })}
        />
        {hasError('business_bank_name') && <div className="invalid-feedback">{getFieldError('business_bank_name')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">
          Business Checking Start Date <span className="text-danger">*</span>
        </label>
        <Flatpickr
          className={`form-control ${hasError('business_checking_start_date') ? 'is-invalid' : ''}`}
          value={financial.checkingStartDate}
          onChange={(dates, dateStr) => {
            setFinancial({ ...financial, checkingStartDate: dateStr })
          }}
          options={{
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'm-d-Y',
            maxDate: 'today',
          }}
          placeholder="Select start date"
        />
        {hasError('business_checking_start_date') && (
          <div className="invalid-feedback d-block">{getFieldError('business_checking_start_date')}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Self-Reported Personal Credit Score <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={financial.personalCreditScore}
          onChange={(value) => setFinancial({ ...financial, personalCreditScore: value })}
          options={selfReportedCreditScoreOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select self-reported personal credit score"
          className={`w-100 ${hasError('self_reported_personal_credit_score') ? 'is-invalid' : ''}`}
        />
        {hasError('self_reported_personal_credit_score') && (
          <div className="invalid-feedback d-block">{getFieldError('self_reported_personal_credit_score')}</div>
        )}
      </div>
      <div className="col-md-6">
        <label className="form-label">Self-Reported Business Credit Score</label>
        <CustomDropdown
          value={financial.businessCreditScore}
          onChange={(value) => setFinancial({ ...financial, businessCreditScore: value })}
          options={selfReportedBusinessCreditScoreOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select self-reported business credit score"
          className={`w-100 ${hasError('self_reported_business_credit_score') ? 'is-invalid' : ''}`}
        />
        {hasError('self_reported_business_credit_score') && (
          <div className="invalid-feedback d-block">{getFieldError('self_reported_business_credit_score')}</div>
        )}
      </div>

      <div className="col-md-6 d-flex align-items-center">
        <label className="form-label me-3 mb-0">Existing Business Debt?</label>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="existingDebt"
            id="existingDebtYes"
            checked={financial.existingDebt === true}
            onChange={() => setFinancial({ ...financial, existingDebt: true })}
          />
          <label className="form-check-label" htmlFor="existingDebtYes">
            Yes
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="existingDebt"
            id="existingDebtNo"
            checked={financial.existingDebt === false}
            onChange={() => setFinancial({ ...financial, existingDebt: false, debtBalance: '' })}
          />
          <label className="form-check-label" htmlFor="existingDebtNo">
            No
          </label>
        </div>
      </div>

      {financial.existingDebt && (
        <div className="col-12">
          <label className="form-label">Debt Balance (if yes)</label>
          <input
            type="number"
            className={`form-control ${hasError('debt_balance') ? 'is-invalid' : ''}`}
            placeholder="Enter Debt Balance"
            value={financial.debtBalance}
            onChange={(e) => setFinancial({ ...financial, debtBalance: e.target.value })}
          />
          {hasError('debt_balance') && <div className="invalid-feedback">{getFieldError('debt_balance')}</div>}
        </div>
      )}

      <StepNavigation
        onBack={onBack}
        onNext={handleNext}
        isNextDisabled={!isValid || isSaving}
        loading={loading || isApiLoading || isSaving}
      />
    </form>
  )
}
