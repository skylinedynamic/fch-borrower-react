import React from 'react'
import type { Attestation } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'

type AttestationStepProps = {
  attestation: Attestation
  setAttestation: (data: Attestation) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
}

export default function AttestationStep({
  attestation,
  setAttestation,
  onSubmit,
  onBack,
  loading,
}: AttestationStepProps) {
  if (loading) {
    return <FormSkeleton fieldCount={1} />
  }

  return (
    <form className="row g-3">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <p className="mb-3">
              By signing below, I certify that all information provided in this application is true, complete, and
              accurate to the best of my knowledge. I understand that providing false information may be a violation of
              federal law (18 U.S.C. § 1001) and subject to criminal penalties. I authorize Four Corner Holdings, LLC
              and its partners to obtain credit reports, verify the information provided, and share it with funding
              partners as necessary.
            </p>
            <div className="form-check">
              <input
                id="attestCertify"
                className="form-check-input"
                type="checkbox"
                checked={attestation.certify}
                onChange={(e) => setAttestation({ certify: e.target.checked })}
              />
              <label htmlFor="attestCertify" className="form-check-label">
                I agree <span className="text-danger">*</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <StepNavigation onBack={onBack} onNext={onSubmit} isNextDisabled={!attestation.certify} isLastStep loading={loading} />
    </form>
  )
}
