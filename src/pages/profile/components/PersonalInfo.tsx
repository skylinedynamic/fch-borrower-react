import React, { useEffect, useState } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { toast } from 'react-toastify'
import CustomDropdown from './CustomDropdown'
import { PersonalInfo as PersonalInfoType } from '../types'
import { usePersonalInfo, useSavePersonalInfo } from '../../../modules/profile'
import type { PersonalInfoData, SavePersonalInfoRequest, ErrorResponse, ValidationErrors } from '../../../modules/profile'
import TabLoader from '../../../components/Loader/TabLoader'
import countriesData from '../../../data/countries.json'

interface PersonalInfoProps {
  data: PersonalInfoType
  onChange: (data: PersonalInfoType) => void
  onSave: () => void
}

type StateType = {
  name: string
  code: string
  cities?: string[]
}

type CityType = {
  name: string
  code: string
}

// Helper function to transform API data to component format
const transformApiToComponent = (apiData: PersonalInfoData): PersonalInfoType => {
  return {
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    email: apiData.email || '',
    phoneCountry: apiData.phone_number || '',
    phoneNumber: apiData.phone_number || '',
    country: apiData.country || '',
    city: apiData.city || '',
    state: apiData.state || '',
    zip: apiData.zip_code || '',
    address: apiData.home_address || '',
    homeCountry: apiData.home_phone || '',
    homePhone: apiData.home_phone || '',
    dob: apiData.date_of_birth || '',
    last4ssn: apiData.last_4_ssn || '',
  }
}

export default function PersonalInfo({ data, onChange, onSave }: PersonalInfoProps) {
  const { data: apiData, isLoading, error } = usePersonalInfo()
  const { mutate: savePersonalInfo, isPending: isSaving } = useSavePersonalInfo()
  const [availableStates, setAvailableStates] = useState<StateType[]>([])
  const [availableCities, setAvailableCities] = useState<CityType[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
  // Helper to find country by name or code
  const getCountryByName = (countryName: string) => {
    return countriesData.find(c => c.name === countryName || c.code === countryName)
  }

  // Get the selected country object
  const selectedCountry = getCountryByName(data.country) || countriesData.find(c => c.name === 'United States')

  // Transform component data to API format
  const transformToApiFormat = (formData: PersonalInfoType): SavePersonalInfoRequest => {
    const country = getCountryByName(formData.country)
    return {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      home_address: formData.address,
      city: formData.city,
      state: formData.state, 
      zip_code: formData.zip,
      country: formData.country, 
      country_code: country?.phone_code || '+1', 
      mobile_phone: formData.phoneNumber,
      home_phone: formData.homePhone,
      last_4_ssn: formData.last4ssn,
      date_of_birth: formData.dob,
    }
  }

  // Handle save with validation
  const handleSave = () => {
    // Clear previous errors
    setValidationErrors({})
    
    // Transform and save
    const payload = transformToApiFormat(data)
    
    savePersonalInfo(payload, {
      onSuccess: (response) => {
        toast.success(response.message || 'Personal information saved successfully')
       // onSave() // Call parent onSave if needed
      },
      onError: (error: any) => {
        // Handle validation errors from server
        if (error.response?.data?.errors) {
          setValidationErrors(error.response.data.errors)

        } else {
          toast.error(error.response?.data?.message || 'Failed to save personal information')
        }
      },
    })
  }

  // Helper to get field error
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  // Helper to check if field has error
  const hasError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName]
  }

  // Set default country to United States on initial load
  useEffect(() => {
    if (!data.country && !apiData) {
      const usCountry = countriesData.find(c => c.name === 'United States')
      if (usCountry) {
        onChange({ 
          ...data, 
          country: usCountry.name,
          phoneCountry: usCountry.code,
          homeCountry: usCountry.code
        })
      }
    }
  }, [])

  // Update phone country codes when country changes
  useEffect(() => {
    if (data.country) {
      const country = getCountryByName(data.country)
      if (country && (data.phoneCountry !== country.code || data.homeCountry !== country.code)) {
        onChange({ 
          ...data, 
          phoneCountry: country.code,
          homeCountry: country.code
        })
      }
    }
  }, [data.country])

  // Update available states when country changes
  useEffect(() => {
    if (data.country) {
      const selectedCountry = countriesData.find(c => c.name === data.country || c.code === data.country)
      if (selectedCountry) {
        setAvailableStates(selectedCountry.states)
      } else {
        setAvailableStates([])
      }
    } else {
      setAvailableStates([])
    }
  }, [data.country])

  // Update available cities when state changes
  useEffect(() => {
    if (data.state && availableStates.length > 0) {
      const selectedState = availableStates.find(s => s.name === data.state || s.code === data.state)
      if (selectedState && selectedState.cities) {
        setAvailableCities(selectedState.cities.map(city => ({ name: city, code: city })))
      } else {
        setAvailableCities([])
      }
    } else {
      setAvailableCities([])
    }
  }, [data.state, availableStates])

  // Update component state when API data is loaded
  useEffect(() => {
    if (apiData) {
      const transformedData = transformApiToComponent(apiData)
      onChange(transformedData)
    }
  }, [apiData])

  if (isLoading) {
    return <TabLoader />
  }

  if (error) {
    return (
      <div className="fade-panel">
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error Loading Profile</h5>
          <p className="mb-0">Unable to load your personal information. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className={`form-control ${hasError('first_name') ? 'is-invalid' : ''}`}
            placeholder="Enter first name" 
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            required 
          />
          {hasError('first_name') && (
            <div className="invalid-feedback">{getFieldError('first_name')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className={`form-control ${hasError('last_name') ? 'is-invalid' : ''}`}
            placeholder="Enter last name" 
            value={data.lastName}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
            required 
          />
          {hasError('last_name') && (
            <div className="invalid-feedback">{getFieldError('last_name')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Email <span className="text-danger">*</span></label>
          <input 
            type="email" 
            className={`form-control ${hasError('email') ? 'is-invalid' : ''}`}
            placeholder="Enter email id" 
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            required 
          />
          {hasError('email') && (
            <div className="invalid-feedback">{getFieldError('email')}</div>
          )}
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
              className={`form-control ${hasError('mobile_phone') ? 'is-invalid' : ''}`}
              placeholder="Enter number" 
              value={data.phoneNumber}
              onChange={(e) => onChange({ ...data, phoneNumber: e.target.value })}
              required 
            />
            {hasError('mobile_phone') && (
              <div className="invalid-feedback">{getFieldError('mobile_phone')}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Country <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.country}
            onChange={(value) => {
              onChange({ 
                ...data, 
                country: value,
                state: '', // Reset state when country changes
                city: '' // Reset city when country changes
              })
            }}
            options={countriesData}
            optionLabel="name"
            optionValue="name"
            placeholder="Select country"
            searchable={true}
            className={`w-100 ${hasError('country') ? 'is-invalid' : ''}`}
          />
          {hasError('country') && (
            <div className="invalid-feedback d-block">{getFieldError('country')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.state}
            onChange={(value) => {
              onChange({ 
                ...data, 
                state: value,
                city: '' // Reset city when state changes
              })
            }}
            options={availableStates}
            optionLabel="name"
            optionValue="name"
            placeholder="Select state"
            searchable={true}
            className={`w-100 ${hasError('state') ? 'is-invalid' : ''}`}
            disabled={!data.country}
          />
          {hasError('state') && (
            <div className="invalid-feedback d-block">{getFieldError('state')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">City <span className="text-danger">*</span></label>
          <CustomDropdown
            value={data.city}
            onChange={(value) => onChange({ ...data, city: value })}
            options={availableCities}
            optionLabel="name"
            optionValue="name"
            placeholder="Select city"
            searchable={true}
            className={`w-100 ${hasError('city') ? 'is-invalid' : ''}`}
            disabled={!data.state}
          />
          {hasError('city') && (
            <div className="invalid-feedback d-block">{getFieldError('city')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className={`form-control ${hasError('zip_code') ? 'is-invalid' : ''}`}
            placeholder="Enter zip code" 
            value={data.zip}
            onChange={(e) => onChange({ ...data, zip: e.target.value })}
            required 
          />
          {hasError('zip_code') && (
            <div className="invalid-feedback">{getFieldError('zip_code')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Home Address <span className="text-danger">*</span></label>
          <textarea 
            className={`form-control ${hasError('home_address') ? 'is-invalid' : ''}`}
            placeholder="Enter address" 
            rows={1} 
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            required 
          />
          {hasError('home_address') && (
            <div className="invalid-feedback">{getFieldError('home_address')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Home Phone <span className="text-danger">*</span></label>
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <span className="me-1">{selectedCountry?.code || 'US'}</span>
              <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
            </span>
            <input 
              type="tel" 
              className={`form-control ${hasError('home_phone') ? 'is-invalid' : ''}`}
              placeholder="Enter number" 
              value={data.homePhone}
              onChange={(e) => onChange({ ...data, homePhone: e.target.value })}
              required 
            />
            {hasError('home_phone') && (
              <div className="invalid-feedback">{getFieldError('home_phone')}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
          <Flatpickr
            className={`form-control ${hasError('date_of_birth') ? 'is-invalid' : ''}`}
            value={data.dob}
            onChange={(dates, dateStr) => {
              onChange({ ...data, dob: dateStr })
            }}
            options={{
              dateFormat: "Y-m-d",
              maxDate: "today",
              yearDropdown: true,
              yearRange: "1900:" + new Date().getFullYear(),
            }}
            placeholder="Select date of birth"
          />
          {hasError('date_of_birth') && (
            <div className="invalid-feedback d-block">{getFieldError('date_of_birth')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Last 4 SSN <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className={`form-control ${hasError('last_4_ssn') ? 'is-invalid' : ''}`}
            placeholder="Enter last 4 ssn number" 
            value={data.last4ssn}
            onChange={(e) => onChange({ ...data, last4ssn: e.target.value })}
            maxLength={4}
            required 
          />
          {hasError('last_4_ssn') && (
            <div className="invalid-feedback">{getFieldError('last_4_ssn')}</div>
          )}
        </div>
        <div className="col-12 d-flex justify-content-end mt-4">
          <button 
            type="button" 
            className="btn primary-btn" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
