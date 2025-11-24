import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

type PersonalInfo = {
  firstName: string
  lastName: string
  email: string
  phoneCountry: string
  phoneNumber: string
  country: string
  city: string
  state: string
  zip: string
  address: string
  homeCountry: string
  homePhone: string
  dob: string
  last4ssn: string
}

type BusinessDetails = {
  businessName: string
  ein: string
  businessPhoneCountry: string
  businessPhone: string
  businessAddress: string
  city: string
  state: string
  zip: string
  entityType: string
  industryType: string
  website: string
}

type FinancialSupport = {
  currency: string
  yearsInBusiness: string
  monthlyRevenue: string
  annualRevenue: string
  fundingAmount: string
  fundingUrgency: string
  fundingPurpose: string
  personalCreditScore: string
  businessCreditScore: string
  note: string
  existingDebt: string
  consent: boolean
}

export default function PreQualification() {
  const [step, setStep] = useState<number>(0)
  const [saving, setSaving] = useState(false)

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

  

  return (
    <div className="page-content prequalification-page">
      <div className="container-fluid min-vh-70 pt-2">
        <div className="text-center mb-4">
          <h3 className="mb-1">Prequalify to Build Your Business Credit. Access the Right Capital.</h3>
          <div className="text-muted mx-auto intro-text">
            <span className="d-block">We don't just help you get funding – we guarantee strategies to build business credit, improve fundability, and secure long-term growth.</span>
            <span className="d-block">Complete your profile to get matched with pre-qualified programs – no credit impact.</span>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-center">
        <div className="card w-100 main-card">
          <div className="card-header p-0">
            <div className="text-center py-4">
              <h4 className="mb-1">{step===0?'Personal Info':step===1?'Business Details':step===2?'Funding Needs':'Review'}</h4>
              <div className="text-muted">{step===0?"Let's start with your personal information":step===1?"Tell us about your business":step===2?"Help us understand your funding needs":"Confirm your details before submitting"}</div>
            </div>
            <ul className="tab-chevrons">
              <li>
                <button type="button" className={`tab-btn ${step===0?'active':''}`} onClick={() => setStep(0)}>Personal Info</button>
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===1?'active':''}`} onClick={() => setStep(1)}>Business Details</button>
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===2?'active':''}`} onClick={() => setStep(2)}>Funding Needs</button>
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===3?'active':''}`} onClick={() => setStep(3)}>Review</button>
              </li>
            </ul>
          </div>
          <div className="card-body checkout-tab">
            {step === 0 && (
            <div className="fade-panel">
            <form className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter first name" value={personal.firstName} onChange={(e)=>setPersonal({...personal,firstName:e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter last name" value={personal.lastName} onChange={(e)=>setPersonal({...personal,lastName:e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email <span className="text-danger">*</span></label>
                <input type="email" className="form-control" placeholder="Enter email" value={personal.email} onChange={(e)=>setPersonal({...personal,email:e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                <div className="input-group">
                  <select className="form-select" value={personal.phoneCountry} onChange={(e)=>setPersonal({...personal,phoneCountry:e.target.value})}>
                    <option>USA (+1)</option>
                    <option>Canada (+1)</option>
                  </select>
                  <input type="tel" className="form-control" placeholder="Enter number" value={personal.phoneNumber} onChange={(e)=>setPersonal({...personal,phoneNumber:e.target.value})} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Business Website</label>
                <input type="url" className="form-control" placeholder="Enter business website" value={business.website} onChange={(e)=>setBusiness({...business,website:e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">State of Incorporation <span className="text-danger">*</span></label>
                <select className="form-select" value={business.state} onChange={(e)=>setBusiness({...business,state:e.target.value})}>
                  <option value="">Select state</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="IL">Illinois</option>
                </select>
              </div>
              <div className="col-12 d-flex justify-content-end mt-4">
                <button type="button" className="btn next-btn" onClick={()=>setStep(1)}>Next Step</button>
              </div>
            </form>
            </div>
            )}

            {step === 1 && (
            <div className="fade-panel">
            <form className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Business Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter business name" value={business.businessName} onChange={(e)=>setBusiness({...business,businessName: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Industry <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter industry or website" value={business.industryType} onChange={(e)=>setBusiness({...business,industryType: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Business Structure <span className="text-danger">*</span></label>
                <select className="form-select" value={business.entityType} onChange={(e)=>setBusiness({...business,entityType: e.target.value})}>
                  <option value="">Select business structure</option>
                  <option value="LLC">LLC</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Time in Business <span className="text-danger">*</span></label>
                <select className="form-select" value={support.yearsInBusiness} onChange={(e)=>setSupport({...support,yearsInBusiness: e.target.value})}>
                  <option value="">Select time in business</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="5">5+ years</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="$40,000" value={support.monthlyRevenue} onChange={(e)=>setSupport({...support,monthlyRevenue: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Annual Revenue <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="$60,000" value={support.annualRevenue} onChange={(e)=>setSupport({...support,annualRevenue: e.target.value})} />
              </div>
              <div className="col-12 d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-warning" onClick={() => setStep(0)}>Previous</button>
                <button type="button" className="btn next-btn" onClick={() => setStep(2)}>Next Step</button>
              </div>
            </form>
            </div>
            )}

            {step === 2 && (
            <div className="fade-panel">
            <form className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Funding Requested Amount <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter funding amount needed" value={support.fundingAmount} onChange={(e)=>setSupport({...support,fundingAmount: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Funding Urgency <span className="text-danger">*</span></label>
                <select className="form-select" value={support.fundingUrgency} onChange={(e)=>setSupport({...support,fundingUrgency: e.target.value})}>
                  <option value="">Select urgency</option>
                  <option value="Immediate">Immediate</option>
                  <option value="30_days">Within 30 days</option>
                  <option value="1_3_months">1-3 months</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Purpose of Funding <span className="text-danger">*</span></label>
                <select className="form-select" value={support.fundingPurpose} onChange={(e)=>setSupport({...support,fundingPurpose: e.target.value})}>
                  <option value="">Select purpose</option>
                  <option value="Working Capital">Working Capital</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Expansion">Expansion</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Personal Credit Score <span className="text-danger">*</span></label>
                <select className="form-select" value={support.personalCreditScore} onChange={(e)=>setSupport({...support,personalCreditScore: e.target.value})}>
                  <option value="">Select personal credit score</option>
                  <option value="Poor">Poor (&lt;580)</option>
                  <option value="Fair">Fair (580-669)</option>
                  <option value="Good">Good (670-739)</option>
                  <option value="Very Good">Very Good (740-799)</option>
                  <option value="Excellent">Excellent (800+)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Estimate Business Credit Score</label>
                <select className="form-select" value={support.businessCreditScore} onChange={(e)=>setSupport({...support,businessCreditScore: e.target.value})}>
                  <option value="">Select business credit score</option>
                  <option value="None">No Business Credit</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Note</label>
                <textarea className="form-control" placeholder="Enter notes" rows={1} value={support.note} onChange={(e)=>setSupport({...support,note: e.target.value})} />
              </div>
              <div className="col-12 d-flex align-items-center gap-3">
                <span className="fw-medium">Existing Business Debt?</span>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" name="existingDebt" id="debtYes" value="yes" checked={support.existingDebt==='yes'} onChange={(e)=>setSupport({...support,existingDebt: e.target.value})} />
                  <label className="form-check-label" htmlFor="debtYes">Yes</label>
                </div>
                <div className="form-check form-check-inline">
                  <input className="form-check-input" type="radio" name="existingDebt" id="debtNo" value="no" checked={support.existingDebt==='no'} onChange={(e)=>setSupport({...support,existingDebt: e.target.value})} />
                  <label className="form-check-label" htmlFor="debtNo">No</label>
                </div>
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="contactConsent" checked={support.consent} onChange={(e)=>setSupport({...support,consent: e.target.checked})} />
                  <label className="form-check-label" htmlFor="contactConsent">I agree to be contacted by Four Corner Holdings, LLC</label>
                </div>
              </div>
              <div className="col-12 d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-warning" onClick={() => setStep(1)}>Previous</button>
                <button type="button" className="btn next-btn" onClick={() => setStep(3)}>Next Step</button>
              </div>
            </form>
            </div>
            )}

            {step === 3 && (
            <div className="fade-panel">
            <div className="review-grid">
              <div className="review-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Personal Info</h6>
                  <button type="button" className="btn btn-sm btn-warning" onClick={() => setStep(0)}>Edit</button>
                </div>
                <div className="kv"><div className="label">First Name</div><div className="value">{personal.firstName || '—'}</div></div>
                <div className="kv"><div className="label">Last Name</div><div className="value">{personal.lastName || '—'}</div></div>
                <div className="kv"><div className="label">Email</div><div className="value">{personal.email || '—'}</div></div>
                <div className="kv"><div className="label">Phone Number</div><div className="value">{personal.phoneCountry} {personal.phoneNumber || ''}</div></div>
                <div className="kv"><div className="label">Business Website</div><div className="value">{business.website || '—'}</div></div>
                <div className="kv"><div className="label">State of Incorporation</div><div className="value">{business.state || '—'}</div></div>
              </div>

              <div className="review-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Business Details</h6>
                  <button type="button" className="btn btn-sm btn-warning" onClick={() => setStep(1)}>Edit</button>
                </div>
                <div className="kv"><div className="label">Business Name</div><div className="value">{business.businessName || '—'}</div></div>
                <div className="kv"><div className="label">Industry</div><div className="value">{business.industryType || '—'}</div></div>
                <div className="kv"><div className="label">Business Structure</div><div className="value">{business.entityType || '—'}</div></div>
                <div className="kv"><div className="label">Time in Business</div><div className="value">{support.yearsInBusiness || '—'}</div></div>
                <div className="kv"><div className="label">Monthly Revenue</div><div className="value">{support.monthlyRevenue || '—'}</div></div>
                <div className="kv"><div className="label">Annual Revenue</div><div className="value">{support.annualRevenue || '—'}</div></div>
              </div>

              <div className="review-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Funding Needs</h6>
                  <button type="button" className="btn btn-sm btn-warning" onClick={() => setStep(2)}>Edit</button>
                </div>
                <div className="kv"><div className="label">Funding Requested Amount</div><div className="value">{support.fundingAmount || '—'}</div></div>
                <div className="kv"><div className="label">Funding Urgency</div><div className="value">{support.fundingUrgency || '—'}</div></div>
                <div className="kv"><div className="label">Purpose of Funding</div><div className="value">{support.fundingPurpose || '—'}</div></div>
                <div className="kv"><div className="label">Personal Credit Score</div><div className="value">{support.personalCreditScore || '—'}</div></div>
                <div className="kv"><div className="label">Estimate Business Credit Score</div><div className="value">{support.businessCreditScore || '—'}</div></div>
                <div className="kv"><div className="label">Note</div><div className="value">{support.note || '—'}</div></div>
                <div className="kv"><div className="label">Existing Business Debt</div><div className="value">{support.existingDebt ? (support.existingDebt==='yes'?'Yes':'No') : '—'}</div></div>
                <div className="kv"><div className="label">Contact Consent</div><div className="value">{support.consent ? 'Agreed' : 'Not agreed'}</div></div>
              </div>

              <div className="review-card review-card-wide">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">Review your details then submit</div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-warning" onClick={() => setStep(2)}>Previous</button>
                    <button type="button" className="btn next-btn" onClick={onSave}>{saving ? 'Submitting...' : 'Submit'}</button>
                  </div>
                </div>
              </div>
            </div>
            </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
