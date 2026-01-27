import React, { useEffect, useState, useCallback } from 'react'
import type { FundingRequest } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CustomDropdown from '../shared/CustomDropdown'
import { purposeOfFundingOptions, fundingTypeOptions, timeframeOptions, collateralOptions } from '../../../../data/profile'
import { useFundingRequest, useSaveFundingRequest } from '../../../../modules/funding-application/queries'
import { toast } from 'react-toastify'

interface FundingRequestStepProps {
  funding: FundingRequest
  setFunding: (data: FundingRequest) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
  onRegisterSave?: (fn: (() => Promise<boolean>) | null) => void
}

export default function FundingRequestStep({
  funding,
  setFunding,
  onNext,
  onBack,
  loading,
  onRegisterSave,
}: FundingRequestStepProps) {
  const { data: apiData, isLoading: isApiLoading, isSuccess } = useFundingRequest()
  const saveMutation = useSaveFundingRequest()
  const [fundingRequestId, setFundingRequestId] = useState<number | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Memoized save handler
  const handleSave = useCallback(async (): Promise<boolean> => {
    setValidationErrors({})

    const payload = {
      id: fundingRequestId,
      requested_amount: funding.requestedAmount || null,
      purpose_of_funds: funding.purpose || null,
      preferred_funding_type: funding.fundingType || null,
      timeframe_needed: funding.timeframe || null,
      collateral_available: funding.collateral || null,
    }

    try {
      await saveMutation.mutateAsync(payload)
      return true
    } catch (error: any) {
      console.error('Error saving funding request:', error)
      const errors = error.response?.data?.errors
      if (errors) {
        setValidationErrors(errors)
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save funding request')
      }
      return false
    }
  }, [fundingRequestId, funding, saveMutation])

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
      setFundingRequestId(apiData.id || null)
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

  // Helper to get field error
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  // Helper to check if field has error
  const hasError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName]
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const success = await handleSave()
    if (success) {
      onNext()
    }
  }

  const isValid = !!(funding.requestedAmount && funding.purpose && funding.fundingType)

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={5} />
  }

  return (
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label className="form-label">
          Requested Amount <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          className={`form-control ${hasError('requested_amount') ? 'is-invalid' : ''}`}
          placeholder="Enter requested amount"
          value={funding.requestedAmount}
          onChange={(e) => setFunding({ ...funding, requestedAmount: e.target.value })}
        />
        {hasError('requested_amount') && <div className="invalid-feedback">{getFieldError('requested_amount')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">
          Purpose of Funds <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={funding.purpose}
          onChange={(value) => setFunding({ ...funding, purpose: value })}
          options={purposeOfFundingOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select purpose of funds"
          className={`w-100 ${hasError('purpose_of_funds') ? 'is-invalid' : ''}`}
        />
        {hasError('purpose_of_funds') && (
          <div className="invalid-feedback d-block">{getFieldError('purpose_of_funds')}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Preferred Funding Type <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={funding.fundingType}
          onChange={(value) => setFunding({ ...funding, fundingType: value })}
          options={fundingTypeOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select preferred funding type"
          className={`w-100 ${hasError('preferred_funding_type') ? 'is-invalid' : ''}`}
        />
        {hasError('preferred_funding_type') && (
          <div className="invalid-feedback d-block">{getFieldError('preferred_funding_type')}</div>
        )}
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
          className={`w-100 ${hasError('timeframe_needed') ? 'is-invalid' : ''}`}
        />
        {hasError('timeframe_needed') && (
          <div className="invalid-feedback d-block">{getFieldError('timeframe_needed')}</div>
        )}
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
          className={`w-100 ${hasError('collateral_available') ? 'is-invalid' : ''}`}
        />
        {hasError('collateral_available') && (
          <div className="invalid-feedback d-block">{getFieldError('collateral_available')}</div>
        )}
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={handleSubmit}
        isNextDisabled={!isValid}
        loading={loading || isApiLoading || saveMutation.isPending}
      />
    </form>
  )
}
