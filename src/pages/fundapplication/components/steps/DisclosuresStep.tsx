import React, { useEffect } from 'react'
import type { DisclosureConsent } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import DisclosuresSkeleton from '../../../../components/Loader/DisclosuresSkeleton'
import { useDisclosuresConsent } from '../../../../modules/funding-application/queries'

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

  // Pre-fill form from API
  useEffect(() => {
    if (isSuccess && apiData) {
      setDisclosure({
        ...disclosure,
        agreeTerms: apiData.credit_pull_authorization,
        creditCheckConsent: apiData.terms_conditions_acceptance,
      })
    }
  }, [isSuccess, apiData])

  const allRequiredChecked = disclosureItems.every((item) => disclosure[item.key])

  if (loading || isApiLoading) {
    return <DisclosuresSkeleton count={disclosureItems.length} />
  }

  return (
    <form className="row g-3">
      {disclosureItems.map((item) => (
        <div className="col-12" key={item.key}>
          <div className="d-flex align-items-center justify-content-between border rounded p-3">
            <div className="form-check">
              <input
                id={`disc-${item.key}`}
                className="form-check-input"
                type="checkbox"
                checked={disclosure[item.key]}
                onChange={(e) => setDisclosure({ ...disclosure, [item.key]: e.target.checked })}
              />
              <label htmlFor={`disc-${item.key}`} className="form-check-label fw-semibold ms-2">
                {item.label} <span className="text-danger">*</span>
              </label>
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

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!allRequiredChecked} loading={loading || isApiLoading} />
    </form>
  )
}
