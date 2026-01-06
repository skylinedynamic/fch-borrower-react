import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { SavePersonalInfoRequest, SaveBusinessDetailsRequest, SaveFinancialInfoRequest } from '../../modules/profile/types'
import PersonalInfo from './components/PersonalInfo'
import BusinessDetails from './components/BusinessDetails'
import FinancialSupport from './components/FinancialSupport'

export default function Profile() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialStep = tabParam ? parseInt(tabParam, 10) : 0
  
  const [step, setStep] = useState<number>(initialStep)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const [personal, setPersonal] = useState<SavePersonalInfoRequest>({
    first_name: '',
    last_name: '',
    email: '',
    home_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    country_code: '',
    phone_number: '',
    home_phone: '',
    last_4_ssn: '',
    date_of_birth: '',
  })

  const [business, setBusiness] = useState<SaveBusinessDetailsRequest>({
    business_name: '',
    business_ein: '',
    business_phone: '',
    business_email: '',
    duns_number: '',
    business_address: '',
    business_city: '',
    business_state: '',
    business_country: '',
    business_zip_code: '',
    business_website: '',
    business_entity_type: '',
    business_industry_type: '',
  })

  // Start with string values to match existing usage in FinancialSupport before we fix the component
  const [support, setSupport] = useState<any>({
    currency: 'USD',
    years_in_business: '',
    monthly_revenue: '',
    annual_revenue: '',
  })

  const onSave = async () => {
    setSaving(true)
    try {
      toast.success('Profile saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content profile-page">
      <div className="container-fluid min-vh-70 pt-2">
        <div className="text-center mb-4">
          <h3 className="mb-1">Your Profile</h3>
          <div className="text-muted mx-auto intro-text">
            <span className="d-block">Review and update your personal, business, and financial details. Keep Your</span>
            <span className="d-block">information current to streamline applications and support.</span>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-center">
          <div className="card w-100 main-card">
            <div className="card-header p-0">
              <ul className="tab-chevrons">
                <li>
                  <button 
                    type="button" 
                    className={`tab-btn ${step===0?'active':''}`} 
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setStep(0)
                    }}
                  >
                    Personal Info
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    className={`tab-btn ${step===1?'active':''}`} 
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setStep(1)
                    }}
                  >
                    Business Details
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    className={`tab-btn ${step===2?'active':''}`} 
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setStep(2)
                    }}
                  >
                    Financial
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body checkout-tab">
              <div key={step} className="tab-content-anim">
                {step === 0 && (
                  <PersonalInfo 
                    data={personal} 
                    onChange={setPersonal} 
                    onSave={onSave} 
                  />
                )}

                {step === 1 && (
                  <BusinessDetails 
                    data={business} 
                    onChange={setBusiness} 
                    onSave={onSave} 
                    onBack={() => setStep(0)} 
                  />
                )}

                {step === 2 && (
                  <FinancialSupport 
                    data={support} 
                    onChange={setSupport} 
                    onSave={onSave} 
                    onBack={() => setStep(1)} 
                    saving={saving} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
