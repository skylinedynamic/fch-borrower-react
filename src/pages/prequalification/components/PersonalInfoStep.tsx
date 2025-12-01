import React, { useMemo } from 'react'
import type { PersonalInfo, BusinessDetails } from '../../../modules/pre-qualification'
import { countries } from '../../../data/countries'
import CustomDropdown from '../../profile/components/CustomDropdown'
import { formatPhoneNumber } from '../../../utils/formatters'

interface PersonalInfoStepProps {
  personal: PersonalInfo
  business: BusinessDetails
  setPersonal: (data: PersonalInfo) => void
  setBusiness: (data: BusinessDetails) => void
  onNext: () => void
}

export default function PersonalInfoStep({ personal, business, setPersonal, setBusiness, onNext }: PersonalInfoStepProps) {
  // Find the country based on personal.country
  const selectedCountry = useMemo(() => {
    return countries.find(c => c.name === personal.country || c.code === personal.country) || countries.find(c => c.name === 'United States')
  }, [personal.country])

  // Get available states for the selected country
  const availableStates = useMemo(() => {
    return selectedCountry?.states || []
  }, [selectedCountry])

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">First Name <span className="text-danger">*</span></label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Enter first name" 
          value={personal.firstName} 
          onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })} 
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Last Name <span className="text-danger">*</span></label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Enter last name" 
          value={personal.lastName} 
          onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })} 
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Email <span className="text-danger">*</span></label>
        <input 
          type="email" 
          className="form-control" 
          placeholder="Enter email" 
          value={personal.email} 
          onChange={(e) => setPersonal({ ...personal, email: e.target.value })} 
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Phone Number <span className="text-danger">*</span></label>
        <div className="input-group">
          <span className="input-group-text bg-light border">
            <span className="me-1">{selectedCountry?.code || 'US'}</span>
            <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
          </span>
          <input 
            type="tel" 
            className="form-control" 
            placeholder="(555) 555-5555" 
            value={personal.phoneNumber} 
            onChange={(e) => setPersonal({ ...personal, phoneNumber: formatPhoneNumber(e.target.value) })} 
          />
        </div>
      </div>
      <div className="col-md-6">
        <label className="form-label">Business Website</label>
        <input 
          type="url" 
          className="form-control" 
          placeholder="Enter business website" 
          value={business.website} 
          onChange={(e) => setBusiness({ ...business, website: e.target.value })} 
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">State of Incorporation <span className="text-danger">*</span></label>
        <CustomDropdown
          value={business.state}
          onChange={(value) => setBusiness({ ...business, state: value })}
          options={availableStates}
          optionLabel="name"
          optionValue="name"
          placeholder="Select state"
          searchable={true}
          className="w-100"
        />
      </div>
      <div className="col-12 d-flex justify-content-end mt-4">
        <button type="button" className="btn next-btn" onClick={onNext}>Next Step</button>
      </div>
    </form>
  )
}
