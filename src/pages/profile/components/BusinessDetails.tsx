import React from 'react'
import CustomDropdown from './CustomDropdown'
import { BusinessDetails as BusinessDetailsType } from '../types'
import countriesData from '../../../data/countries.json'
import { useBusinessDetails, useSaveBusinessDetails } from '../../../modules/profile/queries'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ValidationErrors } from '../../../modules/profile/types'

interface BusinessDetailsProps {
  data: BusinessDetailsType
  onChange: (data: BusinessDetailsType) => void
  onSave: () => void
  onBack: () => void
}

export default function BusinessDetails({ data, onChange, onSave, onBack }: BusinessDetailsProps) {
  const { data: apiData, isSuccess } = useBusinessDetails()
  const { mutate: saveBusiness, isPending } = useSaveBusinessDetails()
  const [errors, setErrors] = useState<ValidationErrors>({})

  const handleSave = () => {
    setErrors({})
    const payload = {
      business_name: data.businessName,
      business_ein: data.ein,
      business_phone: data.businessPhone,
      business_address: data.businessAddress,
      business_city: data.city,
      business_state: data.state,
      business_zip_code: data.zip,
      business_website: data.website,
      business_entity_type: data.entityType,
      business_industry_type: data.industryType,
    }

    saveBusiness(payload, {
      onSuccess: (response) => {
        if (response.status) {
          toast.success(response.message)
          //onSave()
        } else {
          toast.error(response.message)
          if (response.errors) {
            setErrors(response.errors)
          }
        }
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors)
        } else {
          toast.error('Failed to save business details')
        }
      }
    })
  }

  useEffect(() => {
    if (isSuccess && apiData) {
      onChange({
        ...data,
        businessName: apiData.business_name,
        ein: apiData.business_ein,
        businessPhone: apiData.business_phone,
        businessAddress: apiData.business_address,
        country: apiData.country || 'United States',
        businessPhoneCountry: apiData.country_code,
        state: apiData.business_state,
        city: apiData.business_city,
        zip: apiData.business_postal_code,
        website: apiData.business_website,
        entityType: apiData.business_entity_type,
        industryType: apiData.business_industry_type,
      })
    }
  }, [isSuccess, apiData])

  // Static options for dropdowns
  const entityTypes = [
    { label: 'Corporation (C-Corp)', value: 'Corporation (C-Corp)' },
    { label: 'Corporation (S-Corp)', value: 'Corporation (S-Corp)' },
    { label: 'Franchise', value: 'Franchise' },
    { label: 'Licensed Mortgage Loan Originator (NMLS)', value: 'Licensed Mortgage Loan Originator (NMLS)' },
    { label: 'Licensed Real Estate Agent', value: 'Licensed Real Estate Agent' },
    { label: 'Limited Liability Company (LLC)', value: 'Limited Liability Company (LLC)' },
    { label: 'Mortgage Brokerage (Entity)', value: 'Mortgage Brokerage (Entity)' },
    { label: 'Non-Profit', value: 'Non-Profit' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'Real Estate Brokerage (Entity)', value: 'Real Estate Brokerage (Entity)' },
    { label: 'Sole Proprietorship', value: 'Sole Proprietorship' },
    { label: 'Trust', value: 'Trust' },
    { label: 'Other', value: 'Other' }
  ]

  const industryTypes = [
    { label: 'Accounting & Financial Services', value: 'Accounting & Financial Services' },
    { label: 'Automotive Services & Dealerships', value: 'Automotive Services & Dealerships' },
    { label: 'Beauty, Salon & Spa Services', value: 'Beauty, Salon & Spa Services' },
    { label: 'Cannabis / CBD Industry', value: 'Cannabis / CBD Industry' },
    { label: 'Childcare & Daycare', value: 'Childcare & Daycare' },
    { label: 'Cleaning & Janitorial Services', value: 'Cleaning & Janitorial Services' },
    { label: 'Construction & Contracting', value: 'Construction & Contracting' },
    { label: 'E-Commerce / Online Retail', value: 'E-Commerce / Online Retail' },
    { label: 'Education & Tutoring Services', value: 'Education & Tutoring Services' },
    { label: 'Fitness & Wellness (Gyms, Yoga, Etc.)', value: 'Fitness & Wellness (Gyms, Yoga, Etc.)' },
    { label: 'Franchise Businesses', value: 'Franchise Businesses' },
    { label: 'Government Contractor / Vendor', value: 'Government Contractor / Vendor' },
    { label: 'Healthcare & Medical Practices', value: 'Healthcare & Medical Practices' },
    { label: 'Home Services (Plumbing, HVAC, Landscaping, etc.)', value: 'Home Services (Plumbing, HVAC, Landscaping, etc.)' },
    { label: 'Hospitality (Hotels / Lodging)', value: 'Hospitality (Hotels / Lodging)' },
    { label: 'IT & Software Development', value: 'IT & Software Development' },
    { label: 'Legal & Professional Services', value: 'Legal & Professional Services' },
    { label: 'Manufacturing & Wholesale', value: 'Manufacturing & Wholesale' },
    { label: 'Marketing, Advertising & Media', value: 'Marketing, Advertising & Media' },
    { label: 'Non-Profit Organization', value: 'Non-Profit Organization' },
    { label: 'Real Estate & Property Management', value: 'Real Estate & Property Management' },
    { label: 'Restaurants, Bars & Catering', value: 'Restaurants, Bars & Catering' },
    { label: 'Retail (Brick & Mortar)', value: 'Retail (Brick & Mortar)' },
    { label: 'Transportation & Logistics', value: 'Transportation & Logistics' },
    { label: 'Other', value: 'Other' }
  ]

  const selectedCountry = useMemo(() => {
    return countriesData.find(c => c.name === (data.country || 'United States'))
  }, [data.country])

  const states = useMemo(() => {
    return selectedCountry?.states.map(s => ({ label: s.name, value: s.name })) || []
  }, [selectedCountry])

  const cities = useMemo(() => {
    const selectedState = selectedCountry?.states.find(s => s.name === data.state)
    return selectedState?.cities.map(c => ({ label: c, value: c })) || []
  }, [selectedCountry, data.state])

  const phoneCountry = useMemo(() => {
    return countriesData.find(c => c.phone_code === data.businessPhoneCountry)
  }, [data.businessPhoneCountry])

  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Legal Business Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            value={data.businessName} 
            onChange={(e) => onChange({ ...data, businessName: e.target.value })} 
            className={`form-control ${errors.business_name ? 'is-invalid' : ''}`}
          />
          {errors.business_name && <div className="invalid-feedback">{errors.business_name}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Business EIN <span className="text-danger">*</span></label>
          <input 
            type="text" 
            value={data.ein} 
            onChange={(e) => onChange({ ...data, ein: e.target.value })} 
            className={`form-control ${errors.business_ein ? 'is-invalid' : ''}`}
          />
          {errors.business_ein && <div className="invalid-feedback">{errors.business_ein}</div>}
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
              className={`form-control ${errors.business_phone ? 'is-invalid' : ''}`}
              placeholder="Enter number" 
              value={data.businessPhone}
              onChange={(e) => onChange({ ...data, businessPhone: e.target.value })}
              required 
            />
            {errors.business_phone && <div className="invalid-feedback">{errors.business_phone}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Business Address <span className="text-danger">*</span></label>
          <input 
            type="text" 
            value={data.businessAddress} 
            onChange={(e) => onChange({ ...data, businessAddress: e.target.value })} 
            className={`form-control ${errors.business_address ? 'is-invalid' : ''}`}
          />
          {errors.business_address && <div className="invalid-feedback">{errors.business_address}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.state}
            onChange={(value) => onChange({ ...data, state: value })}
            options={states}
            optionLabel="label"
            optionValue="value"
            searchable={true}
            placeholder="Select state"
            className={`w-100 ${errors.business_state ? 'is-invalid' : ''}`}
          />
          {errors.business_state && <div className="invalid-feedback d-block">{errors.business_state}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">City <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.city}
            onChange={(value) => onChange({ ...data, city: value })}
            options={cities}
            optionLabel="label"
            optionValue="value"
            searchable={true}
            placeholder="Select city"
            className={`w-100 ${errors.business_city ? 'is-invalid' : ''}`}
          />
          {errors.business_city && <div className="invalid-feedback d-block">{errors.business_city}</div>}
        </div>
      
        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <input 
            type="text" 
            value={data.zip} 
            onChange={(e) => onChange({ ...data, zip: e.target.value })} 
            className={`form-control ${errors.business_zip_code ? 'is-invalid' : ''}`}
          />
          {errors.business_zip_code && <div className="invalid-feedback">{errors.business_zip_code}</div>}
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
            className={`w-100 ${errors.business_entity_type ? 'is-invalid' : ''}`}
          />
          {errors.business_entity_type && <div className="invalid-feedback d-block">{errors.business_entity_type}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Business Website</label>
          <input 
            type="url" 
            value={data.website} 
            onChange={(e) => onChange({ ...data, website: e.target.value })} 
            className={`form-control ${errors.business_website ? 'is-invalid' : ''}`}
          />
          {errors.business_website && <div className="invalid-feedback">{errors.business_website}</div>}
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
            className={`w-100 ${errors.business_industry_type ? 'is-invalid' : ''}`}
          />
          {errors.business_industry_type && <div className="invalid-feedback d-block">{errors.business_industry_type}</div>}
        </div>
        <div className="col-12 d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-warning" onClick={onBack}>Previous</button>
          <button type="button" className="btn primary-btn" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
