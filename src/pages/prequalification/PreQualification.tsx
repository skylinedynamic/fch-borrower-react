import React, { useMemo, useState, useEffect, useRef } from 'react'
import { usePreQualification, useSubmitPersonalInfo, useSubmitBusinessInfo, useSubmitFundingInfo } from '../../modules/pre-qualification'
import type { PersonalInfo, BusinessDetails, FinancialSupport } from '../../modules/pre-qualification'
import PersonalInfoStep from './components/PersonalInfoStep'
import BusinessDetailsStep from './components/BusinessDetailsStep'
import FundingNeedsStep from './components/FundingNeedsStep'
import ReviewStep from './components/ReviewStep'
import TabLoader from '../../components/Loader/TabLoader'

export default function PreQualification() {
  const [step, setStep] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(0)
  const { data: apiData, isLoading } = usePreQualification()
  const submitPersonalInfoMutation = useSubmitPersonalInfo()
  const submitBusinessInfoMutation = useSubmitBusinessInfo()
  const submitFundingInfoMutation = useSubmitFundingInfo()

  // Track the furthest step reached to allow navigation back
  const [maxStepReached, setMaxStepReached] = useState<number>(0)
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({})
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({})
  const [fundingErrors, setFundingErrors] = useState<Record<string, string>>({})

  // Refs to track initial values for change detection
  const initialPersonalRef = useRef<PersonalInfo | null>(null)
  const initialBusinessRef = useRef<BusinessDetails | null>(null)
  const initialSupportRef = useRef<FinancialSupport | null>(null)

  useEffect(() => {
    if (apiData) {
      setPersonal({
        firstName: apiData.first_name || '',
        lastName: apiData.last_name || '',
        email: apiData.email || '',
        phoneCountry: apiData.country_code ? `${apiData.country} (${apiData.country_code})` : 'USA (+1)',
        phoneNumber: apiData.phone_number || '',
        country: apiData.country || '',
        city: apiData.city || '',
        state: apiData.state || '',
        zip: apiData.postal_code || '',
        address: apiData.home_address || '',
        homeCountry: apiData.country_code ? `${apiData.country} (${apiData.country_code})` : 'USA (+1)',
        homePhone: apiData.home_phone || '',
        dob: apiData.date_of_birth || '',
        last4ssn: apiData.last_4_ssn || '',
      })

      setBusiness({
        businessName: apiData.business_name || '',
        ein: apiData.business_ein || '',
        businessPhoneCountry: 'USA (+1)',
        businessPhone: apiData.business_phone || '',
        businessAddress: apiData.business_address || '',
        city: apiData.business_city || '',
        state: apiData.business_state || '',
        zip: apiData.business_postal_code || '',
        entityType: apiData.business_entity_type || '',
        industryType: apiData.business_industry_type || '',
        website: apiData.business_website || '',
      })

      setSupport(prev => ({
        ...prev,
        currency: apiData.currency || 'USD',
        yearsInBusiness: apiData.years_in_business ? String(apiData.years_in_business) : '',
        monthlyRevenue: apiData.monthly_revenue || '',
        annualRevenue: apiData.annual_revenue || '',
      }))
      
      setLoading(false)

      // Store initial values after data is loaded
      setTimeout(() => {
        initialPersonalRef.current = {
          firstName: apiData.first_name || '',
          lastName: apiData.last_name || '',
          email: apiData.email || '',
          phoneCountry: apiData.country_code ? `${apiData.country} (${apiData.country_code})` : 'USA (+1)',
          phoneNumber: apiData.phone_number || '',
          country: apiData.country || '',
          city: apiData.city || '',
          state: apiData.state || '',
          zip: apiData.postal_code || '',
          address: apiData.home_address || '',
          homeCountry: apiData.country_code ? `${apiData.country} (${apiData.country_code})` : 'USA (+1)',
          homePhone: apiData.home_phone || '',
          dob: apiData.date_of_birth || '',
          last4ssn: apiData.last_4_ssn || '',
        }
        initialBusinessRef.current = {
          businessName: apiData.business_name || '',
          ein: apiData.business_ein || '',
          businessPhoneCountry: 'USA (+1)',
          businessPhone: apiData.business_phone || '',
          businessAddress: apiData.business_address || '',
          city: apiData.business_city || '',
          state: apiData.business_state || '',
          zip: apiData.business_postal_code || '',
          entityType: apiData.business_entity_type || '',
          industryType: apiData.business_industry_type || '',
          website: apiData.business_website || '',
        }
        initialSupportRef.current = {
          currency: apiData.currency || 'USD',
          yearsInBusiness: apiData.years_in_business ? String(apiData.years_in_business) : '',
          monthlyRevenue: apiData.monthly_revenue || '',
          annualRevenue: apiData.annual_revenue || '',
          fundingAmount: '',
          fundingUrgency: '',
          fundingPurpose: '',
          personalCreditScore: '',
          businessCreditScore: '',
          note: '',
          existingDebt: 'no',
          debtBalance: '',
          consent: false,
        }
      }, 100)
    } else if (!isLoading) {
       setLoading(false)
    }
  }, [apiData, isLoading])

  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountry: 'USA (+1)',
    phoneNumber: '',
    country: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    homeCountry: 'USA (+1)',
    homePhone: '',
    dob: '',
    last4ssn: '',
  })

  const [business, setBusiness] = useState<BusinessDetails>({
    businessName: '',
    ein: '',
    businessPhoneCountry: 'USA (+1)',
    businessPhone: '',
    businessAddress: '',
    city: '',
    state: '',
    zip: '',
    entityType: '',
    industryType: '',
    website: '',
  })

  const [support, setSupport] = useState<FinancialSupport>({
    currency: 'USD',
    yearsInBusiness: '',
    monthlyRevenue: '',
    annualRevenue: '',
    fundingAmount: '',
    fundingUrgency: '',
    fundingPurpose: '',
    personalCreditScore: '',
    businessCreditScore: '',
    note: '',
    existingDebt: 'no',
    debtBalance: '',
    consent: false,
  })

  const handlePersonalInfoSubmit = async (navigateToStep?: number) => {
    // Check if any required field is empty
    const hasEmptyFields = !personal.firstName.trim() || 
      !personal.lastName.trim() || 
      !personal.email.trim() || 
      !personal.phoneNumber.trim() || 
      !business.state.trim()

    // Check if any field has changed
    const hasChanged = initialPersonalRef.current === null || 
      personal.firstName !== initialPersonalRef.current.firstName ||
      personal.lastName !== initialPersonalRef.current.lastName ||
      personal.email !== initialPersonalRef.current.email ||
      personal.phoneNumber !== initialPersonalRef.current.phoneNumber ||
      business.website !== initialBusinessRef.current?.website ||
      business.state !== initialBusinessRef.current?.state

    // Only call API if fields are empty OR changed
    if (!hasEmptyFields && !hasChanged) {
      // All fields filled and no changes, just navigate to target step
      setPersonalErrors({}) // Clear errors when navigating
      setMaxStepReached(Math.max(maxStepReached, 1))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 1
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      return
    }

    try {
      await submitPersonalInfoMutation.mutateAsync({
        first_name: personal.firstName,
        last_name: personal.lastName,
        email: personal.email,
        phone: personal.phoneNumber,
        business_website: business.website || undefined,
        state_of_incorporation: business.state,
      })
      setPersonalErrors({}) // Clear errors on success
      setMaxStepReached(Math.max(maxStepReached, 1))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 1
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      
      // Update initial values after successful save
      initialPersonalRef.current = { ...personal }
      if (initialBusinessRef.current) {
        initialBusinessRef.current = { ...initialBusinessRef.current, website: business.website, state: business.state }
      }
    } catch (error: any) {
      // Handle API validation errors
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const mappedErrors: Record<string, string> = {}
        
        // Map snake_case API keys to camelCase form keys
        const errorKeyMap: Record<string, string> = {
          'first_name': 'firstName',
          'last_name': 'lastName',
          'email': 'email',
          'phone': 'phoneNumber',
          'business_website': 'website',
          'state_of_incorporation': 'state'
        }
        
        Object.keys(apiErrors).forEach(key => {
          const mappedKey = errorKeyMap[key] || key
          mappedErrors[mappedKey] = typeof apiErrors[key] === 'string' ? apiErrors[key] : apiErrors[key][0]
        })
        
        setPersonalErrors(mappedErrors)
      }
    }
  }

  const handleBusinessInfoSubmit = async (navigateToStep?: number) => {
    // Check if any required field is empty
    const hasEmptyFields = !business.businessName.trim() ||
      !business.industryType.trim() ||
      !business.entityType.trim() ||
      !support.yearsInBusiness.trim() ||
      !support.monthlyRevenue.trim() ||
      !support.annualRevenue.trim()

    // Check if any field has changed
    const hasChanged = initialBusinessRef.current === null ||
      business.businessName !== initialBusinessRef.current.businessName ||
      business.industryType !== initialBusinessRef.current.industryType ||
      business.entityType !== initialBusinessRef.current.entityType ||
      support.yearsInBusiness !== initialSupportRef.current?.yearsInBusiness ||
      support.monthlyRevenue !== initialSupportRef.current?.monthlyRevenue ||
      support.annualRevenue !== initialSupportRef.current?.annualRevenue

    // Only call API if fields are empty OR changed
    if (!hasEmptyFields && !hasChanged) {
      // All fields filled and no changes, just navigate to target step
      setBusinessErrors({}) // Clear errors when navigating
      setMaxStepReached(Math.max(maxStepReached, 2))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 2
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      return
    }
    try {
      const monthlyRevenue = parseFloat(support.monthlyRevenue.replace(/,/g, '')) || 0
      const annualRevenue = parseFloat(support.annualRevenue.replace(/,/g, '')) || 0

      await submitBusinessInfoMutation.mutateAsync({
        business_name: business.businessName,
        industry_type: business.industryType,
        business_structure: business.entityType,
        monthly_revenue: monthlyRevenue,
        annual_revenue: annualRevenue,
        time_in_business: support.yearsInBusiness
      })
      setBusinessErrors({}) // Clear errors on success
      setMaxStepReached(Math.max(maxStepReached, 2))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 2
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      
      // Update initial values after successful save
      initialBusinessRef.current = { ...business }
      if (initialSupportRef.current) {
        initialSupportRef.current = { 
          ...initialSupportRef.current, 
          yearsInBusiness: support.yearsInBusiness,
          monthlyRevenue: support.monthlyRevenue,
          annualRevenue: support.annualRevenue
        }
      }
    } catch (error: any) {
      // Handle API validation errors
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const mappedErrors: Record<string, string> = {}
        
        // Map snake_case API keys to camelCase form keys
        const errorKeyMap: Record<string, string> = {
          'business_name': 'businessName',
          'industry_type': 'industryType',
          'business_structure': 'entityType',
          'monthly_revenue': 'monthlyRevenue',
          'annual_revenue': 'annualRevenue',
          'time_in_business': 'yearsInBusiness'
        }
        
        Object.keys(apiErrors).forEach(key => {
          const mappedKey = errorKeyMap[key] || key
          mappedErrors[mappedKey] = typeof apiErrors[key] === 'string' ? apiErrors[key] : apiErrors[key][0]
        })
        
        setBusinessErrors(mappedErrors)
      }
    }
  }

  const handleFundingInfoSubmit = async (navigateToStep?: number) => {
    // Check if any required field is empty
    const hasEmptyFields = !support.fundingAmount.trim() ||
      !support.fundingUrgency.trim() ||
      !support.fundingPurpose.trim() ||
      !support.personalCreditScore.trim() ||
      !support.businessCreditScore.trim() ||
      (support.existingDebt === 'yes' && !support.debtBalance.trim())

    // Check if any field has changed
    const hasChanged = initialSupportRef.current === null ||
      support.fundingAmount !== initialSupportRef.current.fundingAmount ||
      support.fundingUrgency !== initialSupportRef.current.fundingUrgency ||
      support.fundingPurpose !== initialSupportRef.current.fundingPurpose ||
      support.personalCreditScore !== initialSupportRef.current.personalCreditScore ||
      support.businessCreditScore !== initialSupportRef.current.businessCreditScore ||
      support.existingDebt !== initialSupportRef.current.existingDebt ||
      support.debtBalance !== initialSupportRef.current.debtBalance ||
      support.note !== initialSupportRef.current.note

    // Only call API if fields are empty OR changed
    if (!hasEmptyFields && !hasChanged) {
      // All fields filled and no changes, just navigate to target step
      setFundingErrors({}) // Clear errors when navigating
      setMaxStepReached(Math.max(maxStepReached, 3))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 3
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      return
    }
    try {
      const fundingAmount = support.fundingAmount.trim() ? parseFloat(support.fundingAmount.replace(/,/g, '')) : null
      const debtBalance = support.debtBalance.trim() ? parseFloat(support.debtBalance.replace(/,/g, '')) : null

      await submitFundingInfoMutation.mutateAsync({
        funding_requested_amount: fundingAmount,
        funding_urgency: support.fundingUrgency,
        purpose_of_funding: support.fundingPurpose,
        personal_credit_score: support.personalCreditScore,
        estimated_business_credit_score: support.businessCreditScore,
        existing_business_debt: support.existingDebt === 'yes',
        debt_balance: debtBalance,
        notes: support.note
      })
      setFundingErrors({}) // Clear errors on success
      setMaxStepReached(Math.max(maxStepReached, 3))
      const nextStep = navigateToStep !== undefined ? navigateToStep : 3
      setStep(nextStep)
      setMobileOpenIdx(nextStep)
      
      // Update initial values after successful save
      initialSupportRef.current = { ...support }
    } catch (error: any) {
      // Handle API validation errors
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const mappedErrors: Record<string, string> = {}
        
        // Map snake_case API keys to camelCase form keys
        const errorKeyMap: Record<string, string> = {
          'funding_requested_amount': 'fundingAmount',
          'funding_urgency': 'fundingUrgency',
          'purpose_of_funding': 'fundingPurpose',
          'personal_credit_score': 'personalCreditScore',
          'estimated_business_credit_score': 'businessCreditScore',
          'existing_business_debt': 'existingDebt',
          'debt_balance': 'debtBalance',
          'notes': 'note'
        }
        
        Object.keys(apiErrors).forEach(key => {
          const mappedKey = errorKeyMap[key] || key
          mappedErrors[mappedKey] = typeof apiErrors[key] === 'string' ? apiErrors[key] : apiErrors[key][0]
        })
        
        setFundingErrors(mappedErrors)
      }
    }
  }

  const handleTabClick = async (targetStep: number) => {
    // If clicking the current step, do nothing
    if (targetStep === step) return

    // Always trigger submission when leaving current step (forward or backward)
    // This ensures data is saved if changed
    if (step === 0 && targetStep !== 0) {
      await handlePersonalInfoSubmit(targetStep)
      return
    } else if (step === 1 && targetStep !== 1) {
      await handleBusinessInfoSubmit(targetStep)
      return
    } else if (step === 2 && targetStep !== 2) {
      await handleFundingInfoSubmit(targetStep)
      return
    }

    // If no submission was needed (step 3), allow free navigation
    setStep(targetStep)
    setMobileOpenIdx(mobileOpenIdx === targetStep ? null : targetStep)
  }

  const renderStepSection = (idx: number) => {
    if (idx === 0) {
      return (
        <div className="fade-panel">
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
        <div className="fade-panel">
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
        <div className="fade-panel">
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
        <div className="fade-panel">
          {loading ? (
            <div className="review-grid">
              {[1,2,3].map((i) => (
                <div className="review-card" key={i}>
                  <div className="skeleton-line" style={{ width: 140, height: 18, borderRadius: 8 }}></div>
                  <div className="mt-2">
                    {[1,2,3,4,5,6].map((j) => (
                      <div className="skeleton-line mt-2" key={j} style={{ width: 100 + (j*40), height: 12, borderRadius: 6 }}></div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="review-card review-card-wide">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="skeleton-line" style={{ width: 220, height: 14, borderRadius: 8 }}></div>
                  <div className="d-flex gap-2">
                    <div className="skeleton-line" style={{ width: 100, height: 36, borderRadius: 10 }}></div>
                    <div className="skeleton-line" style={{ width: 120, height: 36, borderRadius: 10 }}></div>
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
                  toast.success('Profile saved')
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
                  <div className="skeleton-line" style={{ width: 220, height: 20, borderRadius: 8 }}></div>
                  <div className="skeleton-line mt-2" style={{ width: 460, height: 14, borderRadius: 8 }}></div>
                </div>
              ) : (
                <>
                  <h4 className="mb-1">{step===0?'Personal Info':step===1?'Business Details':step===2?'Funding Needs':'Review'}</h4>
                  <div className="text-muted">{step===0?"Let's start with your personal information":step===1?"Tell us about your business":step===2?"Help us understand your funding needs":"Confirm your details before submitting"}</div>
                </>
              )}
            </div>
            <ul className="tab-chevrons">
              <li>
                <button 
                  type="button" 
                  className={`tab-btn ${step===0?'active':''}`} 
                  onClick={() => handleTabClick(0)}
                >
                  Personal Info
                </button>
                {mobileOpenIdx===0 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(0)}
                  </div>
                )}
              </li>
              <li>
                <button 
                  type="button" 
                  className={`tab-btn ${step===1?'active':''}`} 
                  onClick={() => handleTabClick(1)}
                  disabled={step < 0 || step > 2}
                  style={{ cursor: (step < 0 || step > 2) ? 'not-allowed' : 'pointer' }}
                >
                  Business Details
                </button>
                {mobileOpenIdx===1 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(1)}
                  </div>
                )}
              </li>
              <li>
                <button 
                  type="button" 
                  className={`tab-btn ${step===2?'active':''}`} 
                  onClick={() => handleTabClick(2)}
                  disabled={step < 1 || step > 3}
                  style={{ cursor: (step < 1 || step > 3) ? 'not-allowed' : 'pointer' }}
                >
                  Funding Needs
                </button>
                {mobileOpenIdx===2 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(2)}
                  </div>
                )}
              </li>
              <li>
                <button 
                  type="button" 
                  className={`tab-btn ${step===3?'active':''}`} 
                  onClick={() => handleTabClick(3)}
                  disabled={step < 2}
                  style={{ cursor: step < 2 ? 'not-allowed' : 'pointer' }}
                >
                  Review
                </button>
                {mobileOpenIdx===3 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(3)}
                  </div>
                )}
              </li>
            </ul>
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
