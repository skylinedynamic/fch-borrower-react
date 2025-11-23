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
}

export default function Profile() {
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

  const activeTabStyle: React.CSSProperties = { background: '#0b2a4a', color: '#fff', borderColor: '#0b2a4a' }
  const inactiveTabStyle: React.CSSProperties = { background: '#eef2f7', color: '#0b2a4a', borderColor: '#eef2f7' }

  return (
    <div className="page-content">
      <div className="container-fluid min-vh-70 d-flex align-items-center justify-content-center pt-2">
        <div className="card w-100" style={{maxWidth: 1080}}>
          <div className="card-header p-0">
            <style>{`
              .tab-chevrons{font-size: 15px;display:flex;background:#eef2f7;border-radius:0px;overflow:visible;width:100%;list-style:none;margin:0;padding:0}
              .tab-chevrons li{flex:1}
              .tab-btn{position:relative;width:100%;background:#dadcdf;color:#0b2a4a;border:none;padding:12px 24px;text-align:center;border-radius:0px !important;transition:background-color .25s ease,color .25s ease}
              .tab-btn.active{background:#0b2a4a;color:#fff;z-index:2}
              .tab-btn.active::after{content:"";position:absolute;right:-20px;top:0;width:0;height:0;border-top:22px solid transparent;border-bottom:24px solid transparent;border-left:20px solid #0b2a4a}
              .tab-chevrons li:last-child .tab-btn.active::after{display:none}
              .tab-chevrons li:first-child .tab-btn{border-top-left-radius:6px;border-bottom-left-radius:6px}
              .tab-chevrons li:last-child .tab-btn{border-top-right-radius:6px;border-bottom-right-radius:6px}
              .fade-panel{animation:fadeSlide .28s ease both}
              @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
              @media (max-width: 576px){
                .tab-chevrons{flex-direction:column;background:transparent;gap:8px}
                .tab-chevrons li{flex:none}
                .tab-btn{border-radius:6px}
                .tab-btn.active::after{display:none}
                .tab-btn.active::before{content:"";position:absolute;left:50%;bottom:-10px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #0b2a4a;transform:translateX(-50%)}
              }
            `}</style>
            <ul className="tab-chevrons">
              <li>
                <button type="button" className={`tab-btn ${step===0?'active':''}`} onClick={() => setStep(0)}>Personal Info</button>
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===1?'active':''}`} onClick={() => setStep(1)}>Business Details</button>
              </li>
              <li>
                <button type="button" className={`tab-btn ${step===2?'active':''}`} onClick={() => setStep(2)}>Financial Support</button>
              </li>
            </ul>
          </div>
          <div className="card-body checkout-tab">
            {step === 0 && (
            <div className="fade-panel">
            <form className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter first name" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter last name" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email <span className="text-danger">*</span></label>
                <input type="email" className="form-control" placeholder="Enter email id" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                <div className="input-group">
                  <select className="form-select">
                    <option>USA (+1)</option>
                    <option>Canada (+1)</option>
                  </select>
                  <input type="tel" className="form-control" placeholder="Enter number" required />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Country <span className="text-danger">*</span></label>
                <select className="form-select" required>
                  <option value="">Select country</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                  <option value="UK">UK</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">City <span className="text-danger">*</span></label>
                <select className="form-select" required>
                  <option value="">Select city</option>
                  <option value="New York">New York</option>
                  <option value="Los Angeles">Los Angeles</option>
                  <option value="Chicago">Chicago</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">State <span className="text-danger">*</span></label>
                <select className="form-select" required>
                  <option value="">Select state</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="IL">Illinois</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Zip Code <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter zip code" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Home Address <span className="text-danger">*</span></label>
                <textarea className="form-control" placeholder="Enter address" rows={1} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Home Phone <span className="text-danger">*</span></label>
                <div className="input-group">
                  <select className="form-select">
                    <option>USA (+1)</option>
                    <option>Canada (+1)</option>
                  </select>
                  <input type="tel" className="form-control" placeholder="Enter number" required />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                <input type="date" className="form-control" required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last 4 SSN <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter last 4 ssn number" required />
              </div>
              <div className="col-12 d-flex justify-content-end mt-4">
                <button type="button" className="btn" style={{background:'#0b2a4a',borderColor:'#0b2a4a',color:'#fff'}} onClick={onSave}>Save Changes</button>
              </div>
            </form>
            </div>
            )}

            {step === 1 && (
            <div className="fade-panel">
            <form className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Legal Business Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter business name" value={business.businessName} onChange={(e)=>setBusiness({...business,businessName: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Business EIN <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter EIN number" value={business.ein} onChange={(e)=>setBusiness({...business,ein: e.target.value})} />
              </div>
               <div className="col-md-6">
                <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                <div className="input-group">
                  <select className="form-select">
                    <option>USA (+1)</option>
                    <option>Canada (+1)</option>
                  </select>
                  <input type="tel" className="form-control" placeholder="Enter number" required />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Business Address <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter business address" value={business.businessAddress} onChange={(e)=>setBusiness({...business,businessAddress: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">City <span className="text-danger">*</span></label>
                <select className="form-select" value={business.city} onChange={(e)=>setBusiness({...business,city: e.target.value})}>
                  <option value="">Select city</option>
                  <option value="New York">New York</option>
                  <option value="Los Angeles">Los Angeles</option>
                  <option value="Chicago">Chicago</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">State <span className="text-danger">*</span></label>
                <select className="form-select" value={business.state} onChange={(e)=>setBusiness({...business,state: e.target.value})}>
                  <option value="">Select state</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="IL">Illinois</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Zip Code <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Enter zip code" value={business.zip} onChange={(e)=>setBusiness({...business,zip: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Entity Type <span className="text-danger">*</span></label>
                <select className="form-select" value={business.entityType} onChange={(e)=>setBusiness({...business,entityType: e.target.value})}>
                  <option value="">Select entity type</option>
                  <option value="LLC">LLC</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Business Website</label>
                <input type="url" className="form-control" placeholder="Enter business website" value={business.website} onChange={(e)=>setBusiness({...business,website: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Industry Type <span className="text-danger">*</span></label>
                <select className="form-select" value={business.industryType} onChange={(e)=>setBusiness({...business,industryType: e.target.value})}>
                  <option value="">Select industry type</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Services">Services</option>
                </select>
              </div>
              <div className="col-12 d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-warning" onClick={() => setStep(0)}>Previous</button>
                <button type="button" className="btn" style={{background:'#0b2a4a',borderColor:'#0b2a4a',color:'#fff'}} onClick={onSave}>Save Changes</button>
              </div>
            </form>
            </div>
            )}

            {step === 2 && (
            <div className="fade-panel">
            <form className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Currency <span className="text-danger">*</span></label>
                <select className="form-select" value={support.currency} onChange={(e)=>setSupport({...support,currency: e.target.value})}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Years in Business <span className="text-danger">*</span></label>
                <select className="form-select" value={support.yearsInBusiness} onChange={(e)=>setSupport({...support,yearsInBusiness: e.target.value})}>
                  <option value="">Select years</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="$20,000" value={support.monthlyRevenue} onChange={(e)=>setSupport({...support,monthlyRevenue: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Annual Revenue</label>
                <input type="text" className="form-control" placeholder="$30,000" value={support.annualRevenue} onChange={(e)=>setSupport({...support,annualRevenue: e.target.value})} />
              </div>
              <div className="col-12 d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-warning" onClick={() => setStep(1)}>Previous</button>
                <button type="button" className="btn" style={{background:'#0b2a4a',borderColor:'#0b2a4a',color:'#fff'}} onClick={onSave}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
