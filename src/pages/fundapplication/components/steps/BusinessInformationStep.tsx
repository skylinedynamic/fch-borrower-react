import React from 'react'
import type { PersonalInfo, BusinessDetails } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'

type BusinessInformationStepProps = {
  personal: PersonalInfo
  business: BusinessDetails
  setPersonal: (data: PersonalInfo) => void
  setBusiness: (data: BusinessDetails) => void
  onNext: () => void
  loading: boolean
}

export default function BusinessInformationStep({
  personal,
  business,
  setPersonal,
  setBusiness,
  onNext,
  loading,
}: BusinessInformationStepProps) {
  const canProceed = !!(
    personal.firstName &&
    personal.lastName &&
    personal.email &&
    personal.phoneNumber &&
    business.businessName &&
    business.businessAddress &&
    business.city &&
    business.state &&
    business.incorporationState &&
    business.zip &&
    business.industryType &&
    business.entityType &&
    business.timeInBusiness
  )

  if (loading) {
    return <FormSkeleton fieldCount={14} />
  }

  return (
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
        <input type="email" className="form-control" placeholder="Enter email id" value={personal.email} onChange={(e)=>setPersonal({...personal,email:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Mobile Phone <span className="text-danger">*</span></label>
        <div className="input-group">
          <select className="form-select" value={personal.phoneCountry} onChange={(e)=>setPersonal({...personal,phoneCountry:e.target.value})}>
            <option>USA (+1)</option>
            <option>Canada (+1)</option>
          </select>
          <input type="tel" className="form-control" placeholder="Enter number" value={personal.phoneNumber} onChange={(e)=>setPersonal({...personal,phoneNumber:e.target.value})} />
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label">Business Name <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter business name" value={business.businessName} onChange={(e)=>setBusiness({...business,businessName:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Business Street Address <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter business street address" value={business.businessAddress} onChange={(e)=>setBusiness({...business,businessAddress:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">City <span className="text-danger">*</span></label>
        <select className="form-select" value={business.city} onChange={(e)=>setBusiness({...business,city:e.target.value})}>
          <option value="">Select city</option>
          <option value="New York">New York</option>
          <option value="Los Angeles">Los Angeles</option>
          <option value="Chicago">Chicago</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">State <span className="text-danger">*</span></label>
        <select className="form-select" value={business.state} onChange={(e)=>setBusiness({...business,state:e.target.value})}>
          <option value="">Select state</option>
          <option value="CA">California</option>
          <option value="NY">New York</option>
          <option value="IL">Illinois</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label">State of Incorporation <span className="text-danger">*</span></label>
        <select className="form-select" value={business.incorporationState} onChange={(e)=>setBusiness({...business,incorporationState:e.target.value})}>
          <option value="">Select state of incorporation</option>
          <option value="CA">California</option>
          <option value="NY">New York</option>
          <option value="IL">Illinois</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Zip Code <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter zip code" value={business.zip} onChange={(e)=>setBusiness({...business,zip:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">Industry Type <span className="text-danger">*</span></label>
        <select className="form-select" value={business.industryType} onChange={(e)=>setBusiness({...business,industryType:e.target.value})}>
          <option value="">Select industry type</option>
          <option value="Retail">Retail</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Services">Services</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Entity Type <span className="text-danger">*</span></label>
        <select className="form-select" value={business.entityType} onChange={(e)=>setBusiness({...business,entityType:e.target.value})}>
          <option value="">Select entity type</option>
          <option value="LLC">LLC</option>
          <option value="Corporation">Corporation</option>
          <option value="Sole Proprietorship">Sole Proprietorship</option>
          <option value="Partnership">Partnership</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label">Time in Business <span className="text-danger">*</span></label>
        <select className="form-select" value={business.timeInBusiness} onChange={(e)=>setBusiness({...business,timeInBusiness:e.target.value})}>
          <option value="">Select time in business</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="5">5+ years</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Number of Employees</label>
        <input type="text" className="form-control" placeholder="Enter number of employees" value={business.employees} onChange={(e)=>setBusiness({...business,employees:e.target.value})} />
      </div>

      <StepNavigation onNext={onNext} isNextDisabled={!canProceed} loading={loading} />
    </form>
  )
}
