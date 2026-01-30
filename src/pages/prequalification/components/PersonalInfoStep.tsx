import React, { useMemo } from 'react'
import { PersonalInfo, BusinessDetails } from '../../../modules/pre-qualification/types'
import CustomDropdown from '../../../components/Common/CustomDropdown'
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



  return (
    <form className="row g-3" onSubmit={(e) => { e.preventDefault(); handleNextClick(); }}>
      <div className="col-md-6">
        <label className="form-label">First Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
          placeholder="John"
          value={personal.firstName}
          onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
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
          onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
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
          onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Phone Number <span className="text-danger">*</span></label>
        <div className="input-group">
          <span className="input-group-text bg-light">{personal.countryCode}</span>
          <input
            type="tel"
            className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
            value={personal.phoneNumber}
            onChange={(e) => setPersonal({ ...personal, phoneNumber: formatPhoneNumber(e.target.value) })}
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
          className={`form-control ${errors.businessWebsite ? 'is-invalid' : ''}`}
          placeholder="https://"
          value={personal.businessWebsite}
          onChange={(e) => setPersonal({ ...personal, businessWebsite: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.businessWebsite && <div className="invalid-feedback">{errors.businessWebsite}</div>}
      </div>

      <div className="col-md-6">
        <label className="form-label">State of Incorporation <span className="text-danger">*</span></label>
        <CustomDropdown
          options={countries.find(c => c.name === 'United States')?.states || []}
          value={personal.stateOfIncorporation}
          onChange={(val) => setPersonal({ ...personal, stateOfIncorporation: val })}
          placeholder="Select State"
          className={errors.stateOfIncorporation ? 'is-invalid' : ''}
          disabled={isSubmitting}
          optionLabel="name"
          optionValue="name"
          searchable={true}
        />
        {errors.stateOfIncorporation && <div className="invalid-feedback d-block">{errors.stateOfIncorporation}</div>}
      </div>

      <div className="col-12 d-flex justify-content-end mt-4">
        <button
          type="submit"
          className="btn next-btn"
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
