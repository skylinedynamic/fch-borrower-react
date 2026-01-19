import React, { useEffect, useState } from 'react'
import type { DisclosureConsent } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import DisclosuresSkeleton from '../../../../components/Loader/DisclosuresSkeleton'
import { useDisclosuresConsent, useSaveDisclosuresConsent } from '../../../../modules/funding-application/queries'
import { toast } from 'react-toastify'

type DisclosuresStepProps = {
  disclosure: DisclosureConsent
  setDisclosure: (data: DisclosureConsent) => void
  disclosureItems: { key: keyof DisclosureConsent; label: string; route: string }[]
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export default function DisclosuresStep({
  disclosure,
  setDisclosure,
  disclosureItems,
  onNext,
  onBack,
  loading,
}: DisclosuresStepProps) {
  const { data: apiData, isLoading: isApiLoading, isSuccess } = useDisclosuresConsent()
  const { mutate: saveDisclosures, isPending: isSaving } = useSaveDisclosuresConsent()
  const [disclosureId, setDisclosureId] = useState<number | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Pre-fill form from API
  useEffect(() => {
    if (isSuccess && apiData) {
      setDisclosureId(apiData.id || null)
      setDisclosure({
        ...disclosure,
        agreeTerms: apiData.credit_pull_authorization,
        creditCheckConsent: apiData.terms_conditions_acceptance,
      })
    }
  }, [isSuccess, apiData])

  const allRequiredChecked = disclosureItems.every((item) => disclosure[item.key])

  const handleSubmit = () => {
     setValidationErrors({})

     const payload = {
        id: disclosureId,
        credit_pull_authorization: disclosure.agreeTerms,
        terms_conditions_acceptance: disclosure.creditCheckConsent,
     }

     saveDisclosures(payload, {
        onSuccess: () => {
           onNext()
        },
        onError: (error: any) => {
           console.error('Error saving disclosures:', error)
           const errors = error.response?.data?.errors
           if (errors) {
              setValidationErrors(errors)
              toast.error('Please resolve validation errors')
           } else {
              toast.error(error.response?.data?.message || 'Failed to save disclosures')
           }
        }
     })
  }

  // Helper to map UI keys to API keys for error display if needed
  // UI key -> API key mapping:
  // agreeTerms -> credit_pull_authorization
  // creditCheckConsent -> terms_conditions_acceptance
  const getApiError = (uiKey: keyof DisclosureConsent) => {
      if (uiKey === 'agreeTerms') return validationErrors['credit_pull_authorization']
      if (uiKey === 'creditCheckConsent') return validationErrors['terms_conditions_acceptance']
      return undefined
  }

  if (loading || isApiLoading) {
    return <DisclosuresSkeleton count={disclosureItems.length} />
  }

  return (
    <form className="row g-3">
      {disclosureItems.map((item) => (
        <div className="col-12" key={item.key}>
          <div className={`d-flex align-items-center justify-content-between border rounded p-3 ${getApiError(item.key) ? 'border-danger' : ''}`}>
            <div className="form-check">
              <input
                id={`disc-${item.key}`}
                className={`form-check-input ${getApiError(item.key) ? 'is-invalid' : ''}`}
                type="checkbox"
                checked={disclosure[item.key] as boolean}
                onChange={(e) => setDisclosure({ ...disclosure, [item.key]: e.target.checked })}
              />
              <label htmlFor={`disc-${item.key}`} className="form-check-label fw-semibold ms-2">
                {item.label} <span className="text-danger">*</span>
              </label>
              {getApiError(item.key) && (
                 <div className="invalid-feedback d-block mt-1">{getApiError(item.key)}</div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center"
              onClick={() => window.open(item.route, '_blank')}
            >
              <i className="ri-eye-line me-1"></i>
              View
            </button>
          </div>
        </div>
      ))}

      <StepNavigation 
         onBack={onBack} 
         onNext={handleSubmit} 
         isNextDisabled={!allRequiredChecked || isSaving} 
         loading={loading || isApiLoading || isSaving} 
      />
    </form>
  )
}
