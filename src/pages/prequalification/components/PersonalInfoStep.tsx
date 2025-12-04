import React, { useMemo } from 'react'
import { PersonalInfo, BusinessDetails } from '../../../modules/pre-qualification/types'
import CustomDropdown from '../../profile/components/CustomDropdown'
import { formatPhoneNumber } from '../../../utils/formatters'
import { countries } from '../../../data/countries'

interface PersonalInfoStepProps {
  personal: PersonalInfo
  business: BusinessDetails
  setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>
  setBusiness: React.Dispatch<React.SetStateAction<BusinessDetails>>
  onNext: () => void
  errors: Record<string, string>
  isSubmitting?: boolean
}

export default function PersonalInfoStep({ 
  personal, 
  business, 
  setPersonal, 
  setBusiness, 
  onNext,
  errors,
  isSubmitting = false
}: PersonalInfoStepProps) {

  const handleNextClick = () => {
    onNext()
  }

  // Find the country based on personal.country
  const selectedCountry = useMemo(() => {
    return countries.find(c => c.name === personal.country || c.code === personal.country) || countries.find(c => c.name === 'United States')
  }, [personal.country])

  // Get available states for the selected country
  const availableStates = useMemo(() => {
    return selectedCountry?.states || []
  }, [selectedCountry])

  return (
    <form className="row g-3" onSubmit={(e) => { e.preventDefault(); handleNextClick(); }}>
      <div className="col-md-6">
        <label className="form-label">First Name <span className="text-danger">*</span></label>
        <input 
          type="text" 
          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
          placeholder="John"
          value={personal.firstName}
          onChange={(e) => setPersonal({...personal, firstName: e.target.value})}
          disabled={isSubmitting}
        />
        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Last Name <span className="text-danger">*</span></label>
        <input 
          type="text" 
          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
          placeholder="Doe"
          value={personal.lastName}
          onChange={(e) => setPersonal({...personal, lastName: e.target.value})}
          disabled={isSubmitting}
        />
        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Email Address <span className="text-danger">*</span></label>
        <input 
          type="email" 
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          placeholder="john.doe@example.com"
          value={personal.email}
          onChange={(e) => setPersonal({...personal, email: e.target.value})}
          disabled={isSubmitting}
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Phone Number <span className="text-danger">*</span></label>
        <div className="input-group">
          <span className="input-group-text bg-light">{personal.phoneCountry.split('(')[1].replace(')', '')}</span>
          <input 
            type="tel" 
            className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
            value={personal.phoneNumber}
            onChange={(e) => setPersonal({...personal, phoneNumber: formatPhoneNumber(e.target.value)})}
            placeholder="(555) 555-5555"
            disabled={isSubmitting}
          />
          {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label">Business Website</label>
        <input 
          type="url" 
          className="form-control"
          placeholder="https://"
          value={business.website}
          onChange={(e) => setBusiness({...business, website: e.target.value})}
          disabled={isSubmitting}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">State of Incorporation <span className="text-danger">*</span></label>
        <CustomDropdown
          options={availableStates}
          value={business.state}
          onChange={(val) => setBusiness({...business, state: val})}
          placeholder="Select State"
          className={errors.state ? 'is-invalid' : ''}
          disabled={isSubmitting}
          optionLabel="name"
          optionValue="name"
          searchable={true}
        />
        {errors.state && <div className="invalid-feedback d-block">{errors.state}</div>}
      </div>

      <div className="col-12 d-flex justify-content-end mt-4">
        <button 
          type="button" 
          className="btn next-btn" 
          onClick={handleNextClick}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            'Next Step'
          )}
        </button>
      </div>
    </form>
  )
}
