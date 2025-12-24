import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import PersonalInfoStep from './components/PersonalInfoStep'
import BusinessDetailsStep from './components/BusinessDetailsStep'
import FundingNeedsStep from './components/FundingNeedsStep'
import ReviewStep from './components/ReviewStep'
import TabLoader from '../../components/Loader/TabLoader'
import StepNavigation from './components/StepNavigation'
import { usePreQualificationForm } from './hooks/usePreQualificationForm'

export default function PreQualification() {
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  
  const {
    step,
    setStep,
    loading,
    mobileOpenIdx,
    setMobileOpenIdx,
    personal,
    setPersonal,
    business,
    setBusiness,
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
  } = usePreQualificationForm()

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
              {[1,2,3].map((i) => (
                <div className="review-card" key={i}>
                  <div className="skeleton-line sk-review-title"></div>
                  <div className="mt-2">
                    {[1,2,3,4,5,6].map((j) => (
                      <div className={`skeleton-line mt-2 sk-review-line-common sk-w-${100 + (j*40)}`} key={j}></div>
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
                  await handleFinalSubmit()
                  toast.success('Pre-qualification submitted successfully')
                  navigate('/my-applications')
                } catch (error) {
                  toast.error('Failed to submit pre-qualification')
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
    return null
  }

  return (
    <div className="page-content prequalification-page">
      <div className="container-fluid min-vh-70 pt-2">
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
            <div className="text-center py-4">
              {loading ? (
                <div className="d-flex flex-column align-items-center">
                  <div className="skeleton-line sk-header-title"></div>
                  <div className="skeleton-line mt-2 sk-header-subtitle"></div>
                </div>
              ) : (
                <>
                  <h4 className="mb-1">{step===0?'Personal Info':step===1?'Business Details':step===2?'Funding Needs':'Review'}</h4>
                  <div className="text-muted">{step===0?"Let's start with your personal information":step===1?"Tell us about your business":step===2?"Help us understand your funding needs":"Confirm your details before submitting"}</div>
                </>
              )}
            </div>
            <StepNavigation 
              step={step} 
              onTabClick={handleTabClick} 
              mobileOpenIdx={mobileOpenIdx} 
              renderStepSection={renderStepSection} 
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
