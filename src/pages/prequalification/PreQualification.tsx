import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import PersonalInfoStep from './components/PersonalInfoStep'
import BusinessDetailsStep from './components/BusinessDetailsStep'
import FundingNeedsStep from './components/FundingNeedsStep'
import ReviewStep from './components/ReviewStep'
import UnderwritingResultStep from './components/UnderwritingResultStep'
import TabLoader from '../../components/Loader/TabLoader'
import StepNavigation from './components/StepNavigation'
import { usePreQualificationForm } from './hooks/usePreQualificationForm'
import { getPreQualificationById } from '../../modules/pre-qualification/services'
import { clearStrayModalBackdrops } from '../../utils/modalBackdrop'

export default function PreQualification() {
  const [saving, setSaving] = useState(false)
  // Id of the application submitted in this session; unlocks the result tab.
  const [submittedId, setSubmittedId] = useState<string | number | null>(null)
  const [underwritingResultData, setUnderwritingResultData] = useState<any>(null)
  const navigate = useNavigate()

  const {
    step,
    setStep,
    loading,
    maxStepReached,
    mobileOpenIdx,
    setMobileOpenIdx,
    personal,
    setPersonal,
    business,
    setBusiness,
    startDateOnFile,
    support,
    setSupport,
    personalErrors,
    businessErrors,
    fundingErrors,
    handlePersonalInfoSubmit,
    handleBusinessInfoSubmit,
    handleFundingInfoSubmit,
    handleTabClick,
    submitPersonalInfoMutation,
    submitBusinessInfoMutation,
    submitFundingInfoMutation,
    handleFinalSubmit,
    startNewApplication,
    preQualId,
  } = usePreQualificationForm()

  // Leaving a submitted application's result starts a new application, which
  // always begins at Personal Info and proceeds step by step; the submitted one
  // stays viewable under My Applications.
  const onTabClick = (targetStep: number) => {
    if (step === 4 && targetStep < 4) {
      startNewApplication()
      setSubmittedId(null)
      setUnderwritingResultData(null)
      setStep(0)
      setMobileOpenIdx(0)
      return
    }
    handleTabClick(targetStep)
  }

  // Polls a submitted application until its evaluation settles (completed,
  // failed or needs correction). A failed poll is retried; after ~10 minutes the
  // latest record is returned and the result tab keeps checking on its own.
  const waitForEvaluation = async (id: string | number, current: any) => {
    let latest = current
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      try {
        const response = await getPreQualificationById(id)
        latest = response?.data ?? response
        if (latest?.gpt_status !== 'PENDING') return latest
      } catch {
        // Transient network error: keep waiting.
      }
    }
    return latest
  }

  // Steps are completed and saved in order: a tab opens for a step already
  // reached, or the very next one (moving there saves the current step first).
  // On a submitted application's result only Personal Info opens, which starts
  // a new application.
  const canOpenTab = (idx: number) => {
    if (step === 4) return idx === 0 || idx === 4
    if (idx === 4) return submittedId !== null
    return idx <= maxStepReached || idx === step + 1
  }

  useEffect(() => {
    // When step changes (especially moving from Review to Underwriting Result),
    // ensure any leftover modal backdrop/classes are completely removed and
    // scroll to top. Only the leftovers: this used to remove every backdrop in
    // the document, including the globally mounted profile modal's, which left
    // that modal sitting over an undimmed page.
    clearStrayModalBackdrops()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const renderStepSection = (idx: number) => {
    if (idx === 0) {
      return (
        <div className="step-content">
          {loading ? (
            <TabLoader count={6} colClass="col-md-6" />
          ) : (
            <PersonalInfoStep
              personal={personal}
              business={business}
              setPersonal={setPersonal}
              setBusiness={setBusiness}
              onNext={handlePersonalInfoSubmit}
              errors={personalErrors}
              isSubmitting={submitPersonalInfoMutation.isPending}
            />
          )}
        </div>
      )
    }
    if (idx === 1) {
      return (
        <div className="step-content">
          {loading ? (
            <TabLoader count={6} colClass="col-md-6" />
          ) : (
            <BusinessDetailsStep
              business={business}
              support={support}
              setBusiness={setBusiness}
              setSupport={setSupport}
              onNext={handleBusinessInfoSubmit}
              onPrevious={() => handleTabClick(0)}
              errors={businessErrors}
              isSubmitting={submitBusinessInfoMutation.isPending}
              startDateOnFile={startDateOnFile}
            />
          )}
        </div>
      )
    }
    if (idx === 2) {
      return (
        <div className="step-content">
          {loading ? (
            <TabLoader count={8} colClass="col-md-6" />
          ) : (
            <FundingNeedsStep
              support={support}
              setSupport={setSupport}
              onNext={handleFundingInfoSubmit}
              onPrevious={() => handleTabClick(1)}
              errors={fundingErrors}
              isSubmitting={submitFundingInfoMutation.isPending}
            />
          )}
        </div>
      )
    }
    if (idx === 3) {
      return (
        <div className="step-content">
          {loading ? (
            <div className="review-grid">
              {[1, 2, 3].map((i) => (
                <div className="review-card" key={i}>
                  <div className="skeleton-line sk-review-title"></div>
                  <div className="mt-2">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <div className={`skeleton-line mt-2 sk-review-line-common sk-w-${100 + (j * 40)}`} key={j}></div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="review-card review-card-wide">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="skeleton-line sk-review-footer-text"></div>
                  <div className="d-flex gap-2">
                    <div className="skeleton-line sk-review-btn"></div>
                    <div className="skeleton-line sk-review-submit-btn"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ReviewStep
              personal={personal}
              business={business}
              support={support}
              onEdit={(stepIdx) => { setStep(stepIdx); setMobileOpenIdx(stepIdx) }}
              onPrevious={() => { setStep(2); setMobileOpenIdx(2) }}
              onSubmit={async () => {
                setSaving(true)
                try {
                  const submitRes: any = await handleFinalSubmit()
                  let payload = submitRes
                  if (payload?.data?.data) {
                    payload = payload.data.data
                  } else if (payload?.data) {
                    payload = payload.data
                  }
                  const finalId = payload?.id || preQualId
                  // Submit returns as soon as the application is saved and the
                  // evaluation runs on the server afterwards, so keep the modal
                  // and its progress bar open until the result is ready.
                  if (finalId && payload?.gpt_status === 'PENDING') {
                    payload = await waitForEvaluation(finalId, payload)
                  }
                  if (finalId) {
                    setSubmittedId(finalId)
                  }
                  if (payload) {
                    setUnderwritingResultData(payload)
                  }
                  toast.success('Pre-qualification submitted successfully')
                  setStep(4)
                  setMobileOpenIdx(4)
                } catch (error: any) {
                  const message = error?.response?.data?.message
                    || (!error?.response && error?.isAxiosError
                      ? 'Network error: Unable to reach the server. Please try again later.'
                      : error?.message)
                    || 'Failed to submit pre-qualification'
                  toast.error(message)
                  throw error
                } finally {
                  setSaving(false)
                }
              }}
              isSaving={saving}
            />
          )}
        </div>
      )
    }
    if (idx === 4) {
      return (
        <div className="step-content">
          <UnderwritingResultStep
            preQualId={submittedId}
            initialData={underwritingResultData}
            onDataLoaded={setUnderwritingResultData}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div className="page-content prequalification-page">
      <div className="container-fluid min-vh-70 pt-4">
        <div className="text-center mb-4">
          <>
            <h3 className="mb-1">Prequalify to Build Your Business Credit. Access the Right Capital.</h3>
            <div className="text-muted mx-auto intro-text">
              <span className="d-block">We don't just help you get funding – we guarantee strategies to build business credit, improve fundability, and secure long-term growth.</span>
              <span className="d-block">Complete your profile to get matched with pre-qualified programs – no credit impact.</span>
            </div>
          </>
        </div>
        <div className="d-flex align-items-center justify-content-center">
          <div className="card w-100 main-card">
            <div className="card-header p-0">
              <div className="text-center py-4 d-none d-md-block">
                {loading ? (
                  <div className="d-flex flex-column align-items-center">
                    <div className="skeleton-line sk-header-title"></div>
                    <div className="skeleton-line mt-2 sk-header-subtitle"></div>
                  </div>
                ) : (
                  <>
                    <h4 className="mb-1">{step === 0 ? 'Personal Info' : step === 1 ? 'Business Details' : step === 2 ? 'Funding Needs' : step === 3 ? 'Review' : 'Underwriting Result'}</h4>
                    <div className="text-muted">{step === 0 ? "Let's start with your personal information" : step === 1 ? "Tell us about your business" : step === 2 ? "Help us understand your funding needs" : step === 3 ? "Confirm your details before submitting" : "Your automated pre-qualification outcome"}</div>
                  </>
                )}
              </div>
              <StepNavigation
                step={step}
                onTabClick={onTabClick}
                mobileOpenIdx={mobileOpenIdx}
                renderStepSection={renderStepSection}
                isSubmitted={submittedId !== null}
                canOpen={canOpenTab}
              />
            </div>
            <div className="card-body checkout-tab d-none d-md-block">
              {renderStepSection(step)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
