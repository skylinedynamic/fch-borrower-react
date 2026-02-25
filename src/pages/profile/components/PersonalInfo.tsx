import React, { useEffect, useState } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { toast } from 'react-toastify'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { usePersonalInfo, useSavePersonalInfo } from '../../../modules/profile'
import type { PersonalInfoData, SavePersonalInfoRequest, ValidationErrors } from '../../../modules/profile'
import TabLoader from '../../../components/Loader/TabLoader'
import { countries as countriesData } from '../../../data/countries'

import { formatPhoneNumber, formatLast4SSN } from '../../../utils/formatters'
import { useAuth } from '../../../hooks/useAuth'

interface PersonalInfoProps {
  data: SavePersonalInfoRequest
  onChange: (data: SavePersonalInfoRequest) => void
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
const transformApiToComponent = (apiData: PersonalInfoData): SavePersonalInfoRequest => {
  return {
    first_name: apiData.first_name || '',
    last_name: apiData.last_name || '',
    email: apiData.email || '',
    phone_number: apiData.phone_number || '',
    country: apiData.country || '',
    city: apiData.city || '',
    state: apiData.state || '',
    zip_code: apiData.zip_code || '',
    home_address: apiData.home_address || '',
    home_phone: apiData.home_phone || '',
    date_of_birth: apiData.date_of_birth || '',
    last_4_ssn: apiData.last_4_ssn || '',
    country_code: '+1',
  }
}

export default function PersonalInfo({ data, onChange, onSave }: PersonalInfoProps) {
  const { data: apiData, isLoading, error } = usePersonalInfo()
  const { mutate: savePersonalInfo, isPending: isSaving } = useSavePersonalInfo()
  const { refreshUser } = useAuth()
  const [availableStates, setAvailableStates] = useState<StateType[]>([])
  const [availableCities, setAvailableCities] = useState<CityType[]>([])
  const [showCityInput, setShowCityInput] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  // Helper to find country by name or code
  const getCountryByName = (countryName: string) => {
    return countriesData.find(c => c.name === countryName || c.code === countryName)
  }

  // Get the selected country object
  const selectedCountry = data.country ? getCountryByName(data.country) : undefined

  // Get country code from selected country
  const getCountryCode = () => {
    const country = getCountryByName(data.country)
    return country?.phone_code || '+1'
  }

  // Handle save with validation
  const handleSave = () => {
    // Clear previous errors
    setValidationErrors({})

    // Ensure country_code is set
    const payload = {
      ...data,
      country_code: getCountryCode()
    }

    savePersonalInfo(payload, {
      onSuccess: async (response) => {
        toast.success(response.message || 'Personal information saved successfully')
        await refreshUser()
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



  // Update phone country codes when country changes
  useEffect(() => {
    if (data.country) {
      const country = getCountryByName(data.country)
      if (country && data.country_code !== country.phone_code) {
        onChange({
          ...data,
          country_code: country.phone_code
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
        const cities = selectedState.cities.map(city => ({ name: city, code: city }))
        cities.push({ name: 'Others', code: 'Others' })
        setAvailableCities(cities)
      } else {
        setAvailableCities([{ name: 'Others', code: 'Others' }])
      }
    } else {
      setAvailableCities([])
    }
  }, [data.state, availableStates])

  // Sync showCityInput with data.city
  useEffect(() => {
    if (data.city && availableCities.length > 0) {
      // Check if current city exists in the available list (excluding 'Others' entry)
      const exists = availableCities.find(c => c.code === data.city && c.code !== 'Others')
      if (!exists) {
        setShowCityInput(true)
      } else {
        setShowCityInput(false)
      }
    } else if (data.city && availableCities.length === 0) {
      // If city is set but no list (e.g. initial load or weird state), assumed valid if we can't check?
      // Actually if we interpret as "Others", we show input.
      // But on initial load, availableCities might be empty until state triggers.
      // Let's rely on the user interaction primarily, but ensuring "Others" is selected if data.city is "Custom"
      // If data.city is "New York" but availableCities empty, we don't want to switch to Others input yet?
      // Safest: ONLY switch to input if we are sure it is NOT in the list.
    }
  }, [data.city, availableCities])

  // Update component state when API data is loaded
  useEffect(() => {
    if (apiData) {
      const transformedData = transformApiToComponent(apiData)
      onChange(transformedData)
    }
  }, [apiData])

  if (isLoading) {
    return <TabLoader count={12} colClass="col-md-6" />
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
            value={data.first_name}
            onChange={(e) => onChange({ ...data, first_name: e.target.value })}
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
            value={data.last_name}
            onChange={(e) => onChange({ ...data, last_name: e.target.value })}
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
              className={`form-control ${hasError('phone_number') ? 'is-invalid' : ''}`}
              placeholder="(555) 555-5555"
              value={data.phone_number}
              onChange={(e) => onChange({ ...data, phone_number: formatPhoneNumber(e.target.value) })}
              required
            />
            {hasError('phone_number') && (
              <div className="invalid-feedback">{getFieldError('phone_number')}</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Home Address <span className="text-danger">*</span></label>
          <textarea
            className={`form-control ${hasError('home_address') ? 'is-invalid' : ''}`}
            placeholder="Enter address"
            rows={1}
            value={data.home_address}
            onChange={(e) => onChange({ ...data, home_address: e.target.value })}
            required
          />
          {hasError('home_address') && (
            <div className="invalid-feedback">{getFieldError('home_address')}</div>
          )}
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
              })
            }}
            options={countriesData}
            optionLabel="name"
            optionValue="name"
            placeholder="Select country"
            searchable={false}
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
              // Find the selected state object to get its cities
              const selectedStateObj = availableStates.find(s => s.name === value || s.code === value)
              let defaultCity = ''
              // Default to the first city if available
              if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
                defaultCity = selectedStateObj.cities[0]
              }

              onChange({
                ...data,
                state: value,
                city: defaultCity
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


        <div className={showCityInput ? "col-md-3" : "col-md-6"}>
          <label className="form-label">City <span className="text-danger">*</span></label>
          <CustomDropdown
            value={showCityInput ? 'Others' : data.city}
            onChange={(value) => {
              if (value === 'Others') {
                setShowCityInput(true)
                onChange({ ...data, city: '' })
              } else {
                setShowCityInput(false)
                onChange({ ...data, city: value })
              }
            }}
            options={availableCities}
            optionLabel="name"
            optionValue="code"
            placeholder="Select city"
            searchable={true}
            className={`w-100 ${hasError('city') ? 'is-invalid' : ''}`}
            disabled={!data.state}
          />

          {hasError('city') && (
            <div className="invalid-feedback">{getFieldError('city')}</div>
          )}

        </div>

        {showCityInput && (
          <div className="col-md-3">
            <label className="form-label">City Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${hasError('city') ? 'is-invalid' : ''}`}
              placeholder="Enter city name"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              required
            />
            {hasError('city') && (
              <div className="invalid-feedback">{getFieldError('city')}</div>
            )}
          </div>
        )}



        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control ${hasError('zip_code') ? 'is-invalid' : ''}`}
            placeholder="Enter zip code"
            value={data.zip_code}
            onChange={(e) => onChange({ ...data, zip_code: e.target.value })}
            required
          />
          {hasError('zip_code') && (
            <div className="invalid-feedback">{getFieldError('zip_code')}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">Home Phone </label>
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <span className="me-1">{selectedCountry?.code || 'US'}</span>
              <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
            </span>
            <input
              type="tel"
              className={`form-control ${hasError('home_phone') ? 'is-invalid' : ''}`}
              placeholder="(555) 555-5555"
              value={data.home_phone}
              onChange={(e) => onChange({ ...data, home_phone: formatPhoneNumber(e.target.value) })}
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
            value={data.date_of_birth}
            onChange={(dates, dateStr) => {
              onChange({ ...data, date_of_birth: dateStr })
            }}
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "j M, Y",
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
            type="password"
            className={`form-control ${hasError('last_4_ssn') ? 'is-invalid' : ''}`}
            placeholder="Enter last 4 digits"
            value={data.last_4_ssn}
            onChange={(e) => onChange({ ...data, last_4_ssn: formatLast4SSN(e.target.value) })}
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
