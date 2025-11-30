import React from 'react'
import CustomDropdown from './CustomDropdown'
import { BusinessDetails as BusinessDetailsType } from '../types'
import countriesData from '../../../data/countries.json'
import { entityTypes, industryTypes } from '../../../data/profile'
import { useBusinessDetails, useSaveBusinessDetails } from '../../../modules/profile/queries'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ValidationErrors } from '../../../modules/profile/types'
import TabLoader from '../../../components/Loader/TabLoader'

interface BusinessDetailsProps {
  data: BusinessDetailsType
  onChange: (data: BusinessDetailsType) => void
  onSave: () => void
  onBack: () => void
}

export default function BusinessDetails({ data, onChange, onSave, onBack }: BusinessDetailsProps) {

  const { data: apiData, isLoading, isSuccess } = useBusinessDetails()
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


  if (isLoading) {
    return <TabLoader />
  }

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
