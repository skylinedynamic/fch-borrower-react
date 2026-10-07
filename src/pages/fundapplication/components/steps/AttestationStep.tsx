import React, { useState, useEffect } from 'react'
import type { Attestation } from '../../types'
import { useNavigate } from 'react-router-dom'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import { useSaveAttestation, useAttestation } from '../../../../modules/funding-application/queries'
import type { PreviousSignature } from '../../../../modules/funding-application/types'
import { toast } from 'react-toastify'
import { useBrandingStore } from '../../../../store/brandingStore'
import ConfirmationModal from '../../../../components/GlobalModal/ConfirmationModal'
import DisclosureModal from '../shared/DisclosureModal'
import SignaturePad, { toYmd, SIGNATURE_PANEL_STYLE } from '../shared/SignaturePad'
import { signatureTextStyle, useSignatureBlockFont } from '../shared/signatureBlock'

const RESIGN_NOTICE = 'This application was previously submitted, but changes made since then require a new signature. Please review your information below and sign again to resubmit it for review.'
import { TERMS_OF_SERVICE_DATA, PRIVACY_POLICY_DATA, AUTHORIZATION_DATA, ATTESTATION_ITEMS } from '../../../../config/disclosureConfig'

interface AttestationStepProps {
  attestation: Attestation
  setAttestation: (data: Attestation) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
  fundingRequestId?: number | string | null
  isResigning?: boolean
}

export default function AttestationStep({
  attestation,
  setAttestation,
  onSubmit,
  onBack,
  loading,
  fundingRequestId,
  isResigning,
}: AttestationStepProps) {
  const navigate = useNavigate()
  const { branding } = useBrandingStore()
  const [showModal, setShowModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [attestationId, setAttestationId] = useState<number | null>(null)
  
  // Modal State
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: '',
  })
  const toggleModal = () => setModalState({ ...modalState, isOpen: !modalState.isOpen })

  const { data: apiData, isLoading: isApiLoading, isSuccess } = useAttestation(fundingRequestId)
  const { mutate: saveAttestation, isPending: isSaving } = useSaveAttestation()

  // Pre-fill form from API
  const [hasPrefilled, setHasPrefilled] = useState(false)
  
  useEffect(() => {
    if (isSuccess && apiData && !hasPrefilled) {
      setAttestationId(apiData.id || null)
      // A signature already on the application is shown beside the form, never
      // loaded into it: signing again has to be a fresh act, so the name and
      // the consents always start empty.
      setHasPrefilled(true)
    }
  }, [isSuccess, apiData, hasPrefilled])

  // The signature to show for reference: the one an edit cleared while a new
  // one is owed, otherwise the one currently on file.
  const signatureOnFile: PreviousSignature | null = apiData?.signature_data?.signature_name
    ? {
        signature_name: apiData.signature_data.signature_name,
        signature_type: apiData.signature_data.signature_type ?? 'typed',
        signature_image: apiData.signature_data.signature_image ?? null,
        signed_at: apiData.signature_data.signed_at ?? null,
        timezone: apiData.signature_data.timezone ?? null,
      }
    : null
  const previousSignature = isResigning ? apiData?.previous_signature ?? null : signatureOnFile
  // Signing an application that has been signed before, whichever way it got here.
  const isSigningAgain = Boolean(isResigning || signatureOnFile)

  // The Borrower Agreement's Signature block, as set up in the agreement
  // builder. Null when no template has one - the signature keeps its defaults.
  const signatureBlock = apiData?.signature_block ?? null
  useSignatureBlockFont(signatureBlock)

  // Typed name (the input form) or e-signature (an image from the file
  // manager). Only the chosen one counts and is sent.
  const isEsign = attestation.signature_type === 'esign'
  // Today unless the borrower picks an earlier date in the signature block.
  const signatureDate = attestation.signature_date || toYmd(new Date())
  const certificationLead = isEsign ? 'By providing my electronic signature above' : 'By typing my full legal name above'
  // The e-sign consent names how the borrower signed, so what they tick - and
  // what is recorded as ticked - matches what they actually did.
  const attestationItems = ATTESTATION_ITEMS.map(item =>
    item.key === 'esign_consent' && isEsign
      ? { ...item, label: 'I certify that the signature I provided above constitutes my legally binding electronic signature under the ESIGN Act and applicable state laws.' }
      : item
  )

  const handleChange = (field: keyof Attestation, value: any) => {
    if (typeof value === 'boolean' && ['esign_consent', 'terms_consent', 'privacy_consent', 'credit_consent', 'legal_binding_consent'].includes(field)) {
      const timestampKey = `${field}_timestamp` as keyof Attestation;
      setAttestation({ 
        ...attestation, 
        [field]: value,
        [timestampKey]: value ? Date.now() : undefined
      })
    } else {
      setAttestation({ ...attestation, [field]: value })
    }
  }

  const handleConfirm = () => {
    setValidationErrors({})
    const payload = {
      id: attestationId,
      funding_request_id: fundingRequestId || null,
      signature_type: (isEsign ? 'esign' : 'typed') as 'typed' | 'esign',
      signature_name: isEsign ? '' : attestation.signature_name,
      signature_image: isEsign ? attestation.signature_image || '' : null,
      signature_date: isEsign ? signatureDate : null,
      esign_consent: attestation.esign_consent,
      terms_consent: attestation.terms_consent,
      credit_consent: attestation.credit_consent,
      legal_binding_consent: attestation.legal_binding_consent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      application_version: '1.0',
      terms_version: '1.0',
      privacy_version: '1.0',
      credit_auth_version: '1.0',
      consents_data: JSON.stringify([
        ...attestationItems.map(item => ({
          key: item.key,
          label: item.label,
          checked: Boolean(attestation[item.key as keyof Attestation]),
          timestamp: attestation[`${item.key}_timestamp` as keyof Attestation] || null,
          version: '1.0'
        })),
        {
          key: 'final_certification',
          label: `Final Certification: ${certificationLead} and clicking "Submit Application," I certify that all information provided is true and accurate, consent to receive records electronically, authorize Four Corner Funding and its funding partners to obtain and review my business and/or personal credit information as permitted by law, and agree that my electronic signature has the same legal effect as a handwritten signature under the ESIGN Act, UETA, and other applicable law.`,
          checked: true,
          timestamp: Date.now(),
          version: '1.0'
        }
      ]),
    }

    saveAttestation(payload, {
      onSuccess: () => {
        setShowModal(false)
        toast.success(isSigningAgain ? 'Your application has been re-signed and resubmitted for review.' : 'Application submitted successfully!')
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

  const isFormValid = Boolean(
    (isEsign
      ? attestation.signature_image
      : attestation.signature_name && attestation.signature_name.trim().length >= 3) &&
    attestation.esign_consent &&
    attestation.terms_consent &&
    attestation.credit_consent &&
    attestation.legal_binding_consent
  )

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={4} />
  }

  return (
    <>
      <form className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-4 d-flex align-items-center gap-2">
                Electronic Signature & Consent
                {isResigning && (
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle fs-12">
                    <i className="ri-refresh-line align-middle me-1"></i> Re-Signature Required
                  </span>
                )}
              </h5>
              {/* Re-signing with nothing to show for the old signature: the
                  notice has no panel to sit in, so it stands on its own. */}
              {isResigning && !previousSignature?.signature_name && (
                <div className="alert alert-warning small mb-4">{RESIGN_NOTICE}</div>
              )}

              {/* One row, two matching panels: the signature being replaced on
                  the left - shown only, nothing to fill in - and the new one on
                  the right. With no previous signature the new one takes the row. */}
              <div className="row g-3 mb-4">
                {previousSignature?.signature_name && (
                  <div className="col-lg-6 d-flex flex-column">
                    <div className="form-label d-flex align-items-center gap-2 mb-2">
                      Previous Signature
                      {isResigning ? (
                        <span className="badge bg-danger-subtle text-danger">No longer valid</span>
                      ) : (
                        <span className="badge bg-success-subtle text-success">Currently on file</span>
                      )}
                    </div>

                    <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={SIGNATURE_PANEL_STYLE}>
                      <div className="row g-0 flex-grow-1">
                        <div className="col-sm-7">
                          <div className="h-100 d-flex align-items-center justify-content-center text-center p-3" style={{ minHeight: 110 }}>
                            {previousSignature.signature_image ? (
                              <img
                                src={previousSignature.signature_image}
                                alt={`Previous signature of ${previousSignature.signature_name}`}
                                className="mw-100"
                                style={{ maxHeight: 110, opacity: isResigning ? 0.4 : 1 }}
                              />
                            ) : (
                              <span
                                className={`fs-18 fw-semibold text-break ${isResigning ? 'text-decoration-line-through text-muted' : 'text-dark'}`}
                              >
                                {previousSignature.signature_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="col-sm-5" style={{ borderLeft: SIGNATURE_PANEL_STYLE.border }}>
                          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center px-3 py-3" style={{ background: '#f8fafc' }}>
                            <i className="ri-calendar-check-line mb-1" style={{ fontSize: 20, color: '#3b518d', opacity: 0.7 }}></i>
                            <div className="w-100 pb-1 text-dark fs-13 text-nowrap" style={{ borderBottom: '1px solid #64748b' }}>
                              {previousSignature.signed_at || '—'}
                            </div>
                            <span className="mt-1" style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                              Signed On
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2" style={{ borderTop: SIGNATURE_PANEL_STYLE.border, background: '#f8fafc' }}>
                        <small className={`d-flex align-items-start gap-1 ${isResigning ? 'text-warning' : 'text-muted'}`}>
                          <i className={`${isResigning ? 'ri-error-warning-line' : 'ri-information-line'} lh-sm`}></i>
                          <span>
                            {isResigning
                              ? RESIGN_NOTICE
                              : 'This application is already signed. Sign again only if you need to resubmit it.'}
                          </span>
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                <div className={previousSignature?.signature_name ? 'col-lg-6 d-flex flex-column' : 'col-12'}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <label htmlFor={isEsign ? undefined : 'signature_name'} className="form-label d-flex align-items-center gap-1 mb-0">
                      {previousSignature?.signature_name ? 'New Electronic Signature' : 'Electronic Signature'}
                      <span className="text-danger">*</span>
                    </label>
                    {/* One way or the other: a typed name needs no signature
                        image, and a signature image needs no typed name. */}
                    <div className="btn-group btn-group-sm" role="group" aria-label="How would you like to sign?">
                      <button
                        type="button"
                        className={`btn ${isEsign ? 'btn-light border' : 'btn-primary'}`}
                        aria-pressed={!isEsign}
                        onClick={() => handleChange('signature_type', 'typed')}
                      >
                        <i className="ri-keyboard-line align-bottom me-1"></i> Type Name
                      </button>
                      <button
                        type="button"
                        className={`btn ${isEsign ? 'btn-primary' : 'btn-light border'}`}
                        aria-pressed={isEsign}
                        onClick={() => handleChange('signature_type', 'esign')}
                      >
                        <i className="ri-quill-pen-line align-bottom me-1"></i> E-Signature
                      </button>
                    </div>
                  </div>

                  {isEsign ? (
                    <>
                      {/* Signed the way the agreement builder's Signature block is:
                          an image of the signature, chosen in the file manager. */}
                      <SignaturePad
                        value={attestation.signature_image || ''}
                        onChange={(dataUrl) => handleChange('signature_image', dataUrl)}
                        invalid={Boolean(getApiError('signature_image') || getApiError('signature_date'))}
                        block={signatureBlock}
                        date={signatureDate}
                        onDateChange={(date) => handleChange('signature_date', date)}
                        drawable={false}
                        rules={apiData?.signature_rules}
                      />
                      {(getApiError('signature_image') || getApiError('signature_date')) && (
                        <div className="invalid-feedback d-block mt-1">{getApiError('signature_image') || getApiError('signature_date')}</div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* The same panel as the e-signature, holding the input form. */}
                      <div
                        className="flex-grow-1 d-flex flex-column overflow-hidden"
                        style={{ ...SIGNATURE_PANEL_STYLE, ...(getApiError('signature_name') ? { borderColor: '#f06548' } : {}) }}
                      >
                        <div className="flex-grow-1 d-flex align-items-center p-3" style={{ minHeight: 110 }}>
                          <input
                            type="text"
                            id="signature_name"
                            className={`form-control ${getApiError('signature_name') ? 'is-invalid' : ''}`}
                            placeholder="Enter your full legal name"
                            // Typed in the font, size, weight, alignment and colour the
                            // agreement builder gives the Signature block.
                            style={signatureTextStyle(signatureBlock)}
                            value={attestation.signature_name}
                            onChange={(e) => handleChange('signature_name', e.target.value)}
                          />
                        </div>
                        <div className="px-3 py-2" style={{ borderTop: SIGNATURE_PANEL_STYLE.border, background: '#f8fafc' }}>
                          <small className="text-muted d-flex align-items-center gap-1">
                            <i className="ri-information-line"></i>
                            Type your name exactly as it should appear on the application.
                          </small>
                        </div>
                      </div>
                      {getApiError('signature_name') && (
                        <div className="invalid-feedback d-block mt-1">{getApiError('signature_name')}</div>
                      )}
                    </>
                  )}
                </div>
              </div>


              {attestationItems.map((item, idx) => {
                const isLast = idx === attestationItems.length - 1;
                return (
                  <div key={item.key} className={`d-flex align-items-center justify-content-between border rounded p-3 mb-${isLast ? '4' : '2'} ${getApiError(item.key) ? 'border-danger bg-danger-subtle' : ''}`}>
                    <div className="form-check mb-0">
                      <input
                        id={item.key}
                        className={`form-check-input ${getApiError(item.key) ? 'is-invalid' : ''}`}
                        type="checkbox"
                        checked={attestation[item.key as keyof Attestation] as boolean}
                        onChange={(e) => handleChange(item.key as keyof Attestation, e.target.checked)}
                      />
                      <label htmlFor={item.key} className="form-check-label ms-2">
                        <span className="fw-semibold">{item.label}</span>
                        {item.modalContent && (
                          <a
                            href="#!"
                            className="text-primary text-decoration-none fw-semibold ms-1"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setModalState({ isOpen: true, title: item.modalTitle || '', content: item.modalContent || '' })
                            }}
                          >
                            (Read {item.modalTitle})
                          </a>
                        )}
                        <span className="text-danger ms-1">*</span>
                      </label>
                    </div>
                  </div>
                );
              })}

              <div className="alert alert-info small mb-0">
                <strong>Final Certification:</strong> {certificationLead} and clicking "Submit Application," I certify that all information provided is true and accurate, consent to receive records electronically, authorize {branding?.site_name || 'Four Corner Funding'} and its funding partners to obtain and review my business and/or personal credit information as permitted by law, and agree that my electronic signature has the same legal effect as a handwritten signature under the ESIGN Act, UETA, and other applicable law.
              </div>
            </div>
          </div>
        </div>
        <StepNavigation
          onBack={onBack}
          onNext={() => setShowModal(true)}
          isNextDisabled={!isFormValid || isSaving}
          isLastStep
          loading={loading || isSaving || isApiLoading}
        />
      </form>

      <ConfirmationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title={isSigningAgain ? 'Confirm Re-Signature' : 'Confirm Submission'}
        message={isSigningAgain
          ? 'Are you sure you want to re-sign and resubmit your application? Please review all information carefully before confirming.'
          : 'Are you sure you want to submit your application? Please strictly review all information before confirming.'}
        confirmText={isSigningAgain ? 'Re-Sign & Resubmit' : 'Submit Application'}
        loading={isSaving}
        loadingText={isSigningAgain ? 'Resubmitting...' : 'Submitting...'}
        icon="https://cdn.lordicon.com/lupuorrc.json"
        {...(isSigningAgain ? { iconClass: 'ri-quill-pen-line', iconBgClass: 'bg-warning-subtle', iconTextClass: 'text-warning' } : {})}
      />

      <DisclosureModal
        isOpen={modalState.isOpen}
        toggle={toggleModal}
        title={modalState.title}
        content={modalState.content}
      />
    </>
  )
}
