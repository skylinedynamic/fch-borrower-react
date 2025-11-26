import React from 'react'
import CustomDropdown from './CustomDropdown'
import { BusinessDetails as BusinessDetailsType } from '../types'
import countriesData from '../../../data/countries.json'

interface BusinessDetailsProps {
  data: BusinessDetailsType
  onChange: (data: BusinessDetailsType) => void
  onSave: () => void
  onBack: () => void
}

export default function BusinessDetails({ data, onChange, onSave, onBack }: BusinessDetailsProps) {
  // Static options for dropdowns
  const entityTypes = [
    { label: 'LLC', value: 'LLC' },
    { label: 'Corporation', value: 'Corporation' },
    { label: 'Sole Proprietorship', value: 'Sole Proprietorship' }
  ]

  const industryTypes = [
    { label: 'Retail', value: 'Retail' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Services', value: 'Services' }
  ]

  // Placeholder static data for State/City since there is no Country field in BusinessDetails yet
  const states = [
    { label: 'California', value: 'CA' },
    { label: 'New York', value: 'NY' },
    { label: 'Illinois', value: 'IL' }
  ]

  const cities = [
    { label: 'New York', value: 'New York' },
    { label: 'Los Angeles', value: 'Los Angeles' },
    { label: 'Chicago', value: 'Chicago' }
  ]

  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Legal Business Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter business name" 
            value={data.businessName} 
            onChange={(e) => onChange({ ...data, businessName: e.target.value })} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Business EIN <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter EIN number" 
            value={data.ein} 
            onChange={(e) => onChange({ ...data, ein: e.target.value })} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone Number <span className="text-danger">*</span></label>
          <div className="input-group">
            <div className="dropdown position-relative" style={{ minWidth: '140px' }}>
              <CustomDropdown
                value={data.businessPhoneCountry}
                onChange={(value) => onChange({ ...data, businessPhoneCountry: value })}
                options={countriesData}
                optionLabel="code"
                optionValue="code"
                placeholder="Select"
                searchable={true}
                className="border-end-0"
              />
            </div>
            <input 
              type="tel" 
              className="form-control" 
              placeholder="Enter number" 
              value={data.businessPhone}
              onChange={(e) => onChange({ ...data, businessPhone: e.target.value })}
              required 
            />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Business Address <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter business address" 
            value={data.businessAddress} 
            onChange={(e) => onChange({ ...data, businessAddress: e.target.value })} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">City <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.city}
            onChange={(value) => onChange({ ...data, city: value })}
            options={cities}
            optionLabel="label"
            optionValue="value"
            placeholder="Select city"
            className="w-100"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.state}
            onChange={(value) => onChange({ ...data, state: value })}
            options={states}
            optionLabel="label"
            optionValue="value"
            placeholder="Select state"
            className="w-100"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter zip code" 
            value={data.zip} 
            onChange={(e) => onChange({ ...data, zip: e.target.value })} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Entity Type <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.entityType}
            onChange={(value) => onChange({ ...data, entityType: value })}
            options={entityTypes}
            optionLabel="label"
            optionValue="value"
            placeholder="Select entity type"
            className="w-100"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Business Website</label>
          <input 
            type="url" 
            className="form-control" 
            placeholder="Enter business website" 
            value={data.website} 
            onChange={(e) => onChange({ ...data, website: e.target.value })} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Industry Type <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.industryType}
            onChange={(value) => onChange({ ...data, industryType: value })}
            options={industryTypes}
            optionLabel="label"
            optionValue="value"
            placeholder="Select industry type"
            className="w-100"
          />
        </div>
        <div className="col-12 d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-warning" onClick={onBack}>Previous</button>
          <button type="button" className="btn primary-btn" onClick={onSave}>Save Changes</button>
        </div>
      </form>
    </div>
  )
}
