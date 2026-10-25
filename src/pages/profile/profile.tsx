import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SavePersonalInfoRequest, SaveBusinessDetailsRequest, SaveFinancialInfoRequest } from '../../modules/profile/types'
import PersonalInfo from './components/PersonalInfo'
import BusinessDetails from './components/BusinessDetails'
import FinancialSupport from './components/FinancialSupport'
import CreditProfileTab from './components/CreditProfileTab'
import { clearStrayModalBackdrops } from '../../utils/modalBackdrop'
import { useAuthStore } from '../../store/auth'
import { AFTER_CREDIT_PROFILE_ROUTE } from '../../config/onboardingSteps'
import { useFetchProfileCompletion } from '../../modules/profile'
import { isCreditProfileDone, nextProfileTab, PROFILE_TAB, type ProfileTab } from './nextProfileTab'

/** Longer than a Bootstrap/Reactstrap modal fade-out, so a closing popup is gone by then. */
const STRAY_LOCK_RECHECK_MS = 600

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialStep = tabParam ? parseInt(tabParam, 10) : 0

  const [step, setStep] = useState<number>(initialStep)
  const navigate = useNavigate()
  // Where the borrower lands once their credit profile is in (it is submitted
  // once, so this happens once): paid borrowers go on to complete Tier 0 on the
  // Step-By-Step Guide; limited-access (free-trial) borrowers, whose
  // walkthrough ends here and who have no Credit Builder, go to Funding.
  const freeTrial = useAuthStore((state) => !!state.user?.is_free_trail)
  const afterCreditProfile = () => {
    navigate(freeTrial ? AFTER_CREDIT_PROFILE_ROUTE.FREE_TRIAL : AFTER_CREDIT_PROFILE_ROUTE.PAID)
  }

  // A link to /profile?tab=N while already here (e.g. from the Getting Started
  // "what's next" modal) only changes the query, so follow it.
  useEffect(() => {
    if (tabParam !== null) setStep(parseInt(tabParam, 10))
  }, [tabParam])

  // A modal closed mid-way (e.g. the Complete Your Profile popup that brought
  // the borrower here) can leave <body> locked with nothing on screen, and the
  // longer tabs then can't scroll. Give the scroll back on every tab change,
  // and once more after modal fade-outs (~300ms) are over, in case the popup
  // was still closing when the tab opened. It does nothing while a modal
  // really is open.
  useEffect(() => {
    clearStrayModalBackdrops()
    const afterFadeOut = setTimeout(clearStrayModalBackdrops, STRAY_LOCK_RECHECK_MS)
    return () => clearTimeout(afterFadeOut)
  }, [step])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [personal, setPersonal] = useState<SavePersonalInfoRequest>({
    first_name: '',
    middle_name: '',
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
    ssn: '',
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
    business_start_date: '',
    business_credit_score: null,
  })

  const [support, setSupport] = useState<any>({
    currency: 'USD',
    years_in_business: '',
    monthly_revenue: '',
    annual_revenue: '',
    bank_accounts: [],
  })

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  // After a section is saved, on to the next one still to complete -
  // Business, Financial, then the credit profile - once this one is complete.
  const fetchCompletion = useFetchProfileCompletion()
  const creditProfileUpdated = useAuthStore((state) => !!state.user?.credit_profile_updated)
  const afterSave = (saved: ProfileTab) => async () => {
    try {
      const completion = await fetchCompletion()
      const next = nextProfileTab(saved, {
        personal: completion.personal.is_complete,
        business: completion.business.is_complete,
        financial: completion.financial.is_complete,
        creditProfile: isCreditProfileDone(completion.onboarding?.current_step, creditProfileUpdated),
      })
      if (next !== null) setSearchParams({ tab: String(next) })
    } catch {
      // Can't tell what is left: stay on the section just saved.
    }
  }

  return (
    <div className="page-content profile-page">
      <div className="container-fluid min-vh-70 pt-3">
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
                    className={`tab-btn ${step === 0 ? 'active' : ''}`}
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
                    className={`tab-btn ${step === 1 ? 'active' : ''}`}
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
                    className={`tab-btn ${step === 2 ? 'active' : ''}`}
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setStep(2)
                    }}
                  >
                    Financial
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`tab-btn ${step === 3 ? 'active' : ''}`}
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setStep(3)
                    }}
                  >
                    Credit profile
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
                    onSave={afterSave(PROFILE_TAB.PERSONAL)}
                  />
                )}

                {step === 1 && (
                  <BusinessDetails
                    data={business}
                    onChange={setBusiness}
                    onSave={afterSave(PROFILE_TAB.BUSINESS)}
                    onBack={() => setStep(0)}
                  />
                )}

                {step === 2 && (
                  <FinancialSupport
                    data={support}
                    onChange={setSupport}
                    onSave={afterSave(PROFILE_TAB.FINANCIAL)}
                    onBack={() => setStep(1)}
                    saving={saving}
                  />
                )}

                {step === 3 && (
                  <CreditProfileTab onSubmitted={afterCreditProfile} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
