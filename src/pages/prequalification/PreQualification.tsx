import React, { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { usePreQualification } from '../../modules/pre-qualification'
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
    existingDebt: '',
    consent: false,
  })

  const canSavePersonal = useMemo(() => {
    return (
      personal.firstName &&
      personal.lastName &&
      personal.email &&
      personal.phoneNumber &&
      personal.country &&
      personal.city &&
      personal.state &&
      personal.zip &&
      personal.address &&
      personal.dob &&
      personal.last4ssn
    )
  }, [personal])

  const onSave = async () => {
    setSaving(true)
    try {
      toast.success('Profile saved')
    } finally {
      setSaving(false)
    }
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
              onNext={() => { setStep(1); setMobileOpenIdx(1) }} 
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
              onNext={() => { setStep(2); setMobileOpenIdx(2) }} 
              onPrevious={() => { setStep(0); setMobileOpenIdx(0) }} 
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
              onNext={() => { setStep(3); setMobileOpenIdx(3) }} 
              onPrevious={() => { setStep(1); setMobileOpenIdx(1) }} 
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
              onSubmit={onSave} 
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
                <button type="button" className={`tab-btn ${step===0?'active':''}`} onClick={() => {setStep(0); setMobileOpenIdx(mobileOpenIdx===0?null:0)}}>Personal Info</button>
                {mobileOpenIdx===0 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(0)}
                  </div>
                )}
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===1?'active':''}`} onClick={() => {setStep(1); setMobileOpenIdx(mobileOpenIdx===1?null:1)}}>Business Details</button>
                {mobileOpenIdx===1 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(1)}
                  </div>
                )}
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===2?'active':''}`} onClick={() => {setStep(2); setMobileOpenIdx(mobileOpenIdx===2?null:2)}}>Funding Needs</button>
                {mobileOpenIdx===2 && (
                  <div className="p-3 d-block d-md-none">
                    {renderStepSection(2)}
                  </div>
                )}
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===3?'active':''}`} onClick={() => {setStep(3); setMobileOpenIdx(mobileOpenIdx===3?null:3)}}>Review</button>
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
