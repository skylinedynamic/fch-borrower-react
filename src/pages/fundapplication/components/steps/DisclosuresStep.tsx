import React from 'react'
import type { DisclosureConsent } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'

type DisclosuresStepProps = {
  disclosure: DisclosureConsent
  toggleDisclosure: (key: keyof DisclosureConsent, checked: boolean) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}

const disclosureItems: { key: keyof DisclosureConsent; label: string; route: string }[] = [
  { key: 'agreeTerms', label: 'Credit Pull Authorization', route: '/disclosures/terms' },
  { key: 'creditCheckConsent', label: 'Terms & Conditions Acceptance', route: '/disclosures/credit-check' },
]

export default function DisclosuresStep({
  disclosure,
  toggleDisclosure,
  onNext,
  onBack,
  loading,
}: DisclosuresStepProps) {
  const allRequiredChecked = disclosureItems.every((item) => disclosure[item.key])

  if (loading) {
    return <FormSkeleton fieldCount={2} />
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
                onChange={(e) => toggleDisclosure(item.key, e.target.checked)}
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

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!allRequiredChecked} loading={loading} />
    </form>
  )
}
