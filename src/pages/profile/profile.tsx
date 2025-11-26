import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { PersonalInfo as PersonalInfoType, BusinessDetails as BusinessDetailsType, FinancialSupport as FinancialSupportType } from './types'
import PersonalInfo from './components/PersonalInfo'
import BusinessDetails from './components/BusinessDetails'
import FinancialSupport from './components/FinancialSupport'

export default function Profile() {
  const [step, setStep] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  const [personal, setPersonal] = useState<PersonalInfoType>({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountry: 'USA',
    phoneNumber: '',
    country: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    homeCountry: 'USA',
    homePhone: '',
    dob: '',
    last4ssn: '',
  })

  const [business, setBusiness] = useState<BusinessDetailsType>({
    businessName: '',
    ein: '',
    businessPhoneCountry: '+1',
    businessPhone: '',
    businessAddress: '',
    city: '',
    state: '',
    zip: '',
    entityType: '',
    industryType: '',
    website: '',
  })

  const [support, setSupport] = useState<FinancialSupportType>({
    currency: 'USD',
    yearsInBusiness: '',
    monthlyRevenue: '',
    annualRevenue: '',
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
                    Financial Support
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
