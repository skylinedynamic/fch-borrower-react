import React, { useState, useEffect } from 'react'
import type { Attestation } from '../../types'
import { useNavigate } from 'react-router-dom'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import { useSaveAttestation, useAttestation } from '../../../../modules/funding-application/queries'
import { toast } from 'react-toastify'
import ConfirmationModal from '../../../../components/GlobalModal/ConfirmationModal'

interface AttestationStepProps {
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
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [attestationId, setAttestationId] = useState<number | null>(null)

  const { data: apiData, isLoading: isApiLoading, isSuccess } = useAttestation()
  const { mutate: saveAttestation, isPending: isSaving } = useSaveAttestation()

  // Pre-fill form from API
  useEffect(() => {
    if (isSuccess && apiData) {
      setAttestationId(apiData.id || null)
      setAttestation({
        certify: apiData.attestation_authorization,
      })
    }
  }, [isSuccess, apiData, setAttestation])

  const handleConfirm = () => {
    setValidationErrors({})
    const payload = {
      id: attestationId,
      attestation_authorization: attestation.certify,
    }

    saveAttestation(payload, {
      onSuccess: () => {
        setShowModal(false)
        toast.success('Application submitted successfully!')
        navigate('/my-applications')
      },
      onError: (error: any) => {
        setShowModal(false)
        console.error('Error submitting application:', error)
        const errors = error.response?.data?.errors
        if (errors) {
          setValidationErrors(errors)
          toast.error('Please resolve validation errors')
        } else {
          toast.error(error.response?.data?.message || 'Failed to submit application')
        }
      },
    })
  }

  const getApiError = (field: string): string | undefined => validationErrors[field]

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={1} />
  }

  return (
    <>
      <form className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <p className="mb-3">
                By signing below, I certify that all information provided in this application is true, complete, and
                accurate to the best of my knowledge. I understand that providing false information may be a violation
                of federal law (18 U.S.C. § 1001) and subject to criminal penalties. I authorize Four Corner Holdings,
                LLC and its partners to obtain credit reports, verify the information provided, and share it with
                funding partners as necessary.
              </p>
              <div className="form-check">
                <input
                  id="attestCertify"
                  className={`form-check-input ${getApiError('attestation_authorization') ? 'is-invalid' : ''}`}
                  type="checkbox"
                  checked={attestation.certify}
                  onChange={(e) => setAttestation({ certify: e.target.checked })}
                />
                <label htmlFor="attestCertify" className="form-check-label">
                  I agree <span className="text-danger">*</span>
                </label>
                {getApiError('attestation_authorization') && (
                  <div className="invalid-feedback d-block mt-1">{getApiError('attestation_authorization')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <StepNavigation
          onBack={onBack}
          onNext={() => setShowModal(true)}
          isNextDisabled={!attestation.certify || isSaving}
          isLastStep
          loading={loading || isSaving || isApiLoading}
        />
      </form>

      <ConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Confirm Submission"
        message="Are you sure you want to submit your application? Please strictly review all information before confirming."
        confirmText="Confirm Submit"
        loading={isSaving}
        loadingText="Submitting..."
        icon="https://cdn.lordicon.com/lupuorrc.json"
      />
    </>
  )
}
