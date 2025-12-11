import React from 'react'
import CustomDropdown from './CustomDropdown'
import { SaveBusinessDetailsRequest, ValidationErrors } from '../../../modules/profile/types'
import { countries as countriesData } from '../../../data/countries'
import { entityTypes, industryTypes } from '../../../data/profile'
import { useBusinessDetails, useSaveBusinessDetails } from '../../../modules/profile/queries'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import TabLoader from '../../../components/Loader/TabLoader'
import { formatPhoneNumber } from '../../../utils/formatters'

interface BusinessDetailsProps {
  data: SaveBusinessDetailsRequest
  onChange: (data: SaveBusinessDetailsRequest) => void
  onSave: () => void
  onBack: () => void
}

export default function BusinessDetails({ data, onChange, onSave, onBack }: BusinessDetailsProps) {

  const { data: apiData, isLoading, isSuccess } = useBusinessDetails()
  const { mutate: saveBusiness, isPending } = useSaveBusinessDetails()
  const [errors, setErrors] = useState<ValidationErrors>({})

  const handleSave = () => {
    setErrors({})
    saveBusiness(data, {
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
        business_name: apiData.business_name,
        business_ein: apiData.business_ein,
        business_phone: apiData.business_phone,
        business_address: apiData.business_address,
        business_city: apiData.business_city,
        business_state: apiData.business_state,
        business_zip_code: apiData.business_postal_code,
        business_website: apiData.business_website,
        business_entity_type: apiData.business_entity_type,
        business_industry_type: apiData.business_industry_type,
      })
    }
  }, [isSuccess, apiData])

  const selectedCountry = useMemo(() => {
    return countriesData.find(c => c.name === 'United States')
  }, [])

  const states = useMemo(() => {
    const usCountry = countriesData.find(c => c.name === 'United States')
    return usCountry?.states.map(s => ({ label: s.name, value: s.name })) || []
  }, [])




  if (isLoading) {
    return <TabLoader count={10} colClass="col-md-6" />
  }

  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Legal Business Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            placeholder="Enter business name"
            value={data.business_name} 
            onChange={(e) => onChange({ ...data, business_name: e.target.value })} 
            className={`form-control ${errors.business_name ? 'is-invalid' : ''}`}
          />
          {errors.business_name && <div className="invalid-feedback">{errors.business_name}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Business EIN <span className="text-danger">*</span></label>
          <input 
            type="text" 
            placeholder="XX-XXXXXXX"
            value={data.business_ein} 
            onChange={(e) => onChange({ ...data, business_ein: e.target.value })} 
            className={`form-control ${errors.business_ein ? 'is-invalid' : ''}`}
          />
          {errors.business_ein && <div className="invalid-feedback">{errors.business_ein}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone Number </label>
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <span className="me-1">{selectedCountry?.code || 'US'}</span>
              <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
            </span>
            <input 
              type="tel" 
              className={`form-control ${errors.business_phone ? 'is-invalid' : ''}`}
              placeholder="(123) 456-7890" 
              value={data.business_phone}
              onChange={(e) => onChange({ ...data, business_phone: formatPhoneNumber(e.target.value) })}
              maxLength={14}
              required 
            />
            {errors.business_phone && <div className="invalid-feedback">{errors.business_phone}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Business Address <span className="text-danger">*</span></label>
          <input 
            type="text" 
            placeholder="Enter business address"
            value={data.business_address} 
            onChange={(e) => onChange({ ...data, business_address: e.target.value })} 
            className={`form-control ${errors.business_address ? 'is-invalid' : ''}`}
          />
          {errors.business_address && <div className="invalid-feedback">{errors.business_address}</div>}
        </div>

      

        <div className="col-md-6">
          <label className="form-label">City <span className="text-danger">*</span></label>
          <input 
            type="text" 
            value={data.business_city} 
            onChange={(e) => onChange({ ...data, business_city: e.target.value })} 
            className={`form-control ${errors.business_city ? 'is-invalid' : ''}`}
            placeholder="Enter city"
          />
          {errors.business_city && <div className="invalid-feedback">{errors.business_city}</div>}
        </div>

          <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.business_state}
            onChange={(value) => onChange({ ...data, business_state: value })}
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
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <input 
            type="text" 
            placeholder="Enter zip code"
            value={data.business_zip_code} 
            onChange={(e) => onChange({ ...data, business_zip_code: e.target.value })} 
            className={`form-control ${errors.business_zip_code ? 'is-invalid' : ''}`}
          />
          {errors.business_zip_code && <div className="invalid-feedback">{errors.business_zip_code}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Entity Type <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.business_entity_type}
            onChange={(value) => onChange({ ...data, business_entity_type: value })}
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
            placeholder="https://example.com"
            value={data.business_website} 
            onChange={(e) => onChange({ ...data, business_website: e.target.value })} 
            className={`form-control ${errors.business_website ? 'is-invalid' : ''}`}
          />
          {errors.business_website && <div className="invalid-feedback">{errors.business_website}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Industry Type <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.business_industry_type}
            onChange={(value) => onChange({ ...data, business_industry_type: value })}
            options={industryTypes}
            optionLabel="label"
            optionValue="value"
            searchable={true}
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
