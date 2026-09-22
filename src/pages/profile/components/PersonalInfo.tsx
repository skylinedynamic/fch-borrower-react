import React, { useEffect, useState } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { toast } from 'react-toastify'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { usePersonalInfo, useSavePersonalInfo } from '../../../modules/profile'
import type { PersonalInfoData, SavePersonalInfoRequest, ValidationErrors } from '../../../modules/profile'
import TabLoader from '../../../components/Loader/TabLoader'
import { formatCalendarDate } from '../../../utils/dates'
import { countries as countriesData } from '../../../modules/location'

import { formatPhoneNumber, formatLast4SSN, unformatPhoneNumber, formatZipCode } from '../../../utils/formatters'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'
import { useAuth } from '../../../hooks/useAuth'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { LOCKED_PERSONAL_FIELDS } from '../../../config/profileLockFields'
import { useSubmitChangeRequest } from '../../../modules/profile/queries'
import { useRef } from 'react'

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
    country_code: countriesData.find(c => c.name === apiData.country || c.code === apiData.country)?.phone_code || '+1',
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
  const { mutate: submitChange, isPending: isSubmittingChange } = useSubmitChangeRequest()
  const inputRef = useRef<HTMLInputElement>(null)

  // Update Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updateRequest, setUpdateRequest] = useState({
    label: '',
    key: '' as keyof SavePersonalInfoRequest,
    currentValue: '',
    newValue: ''
  })
  const [modalErrors, setModalErrors] = useState<Record<string, string[]>>({})

  const toggleModal = () => {
    if (isModalOpen) setModalErrors({})
    setIsModalOpen(!isModalOpen)
  }

  const handleOpenRequestModal = (label: string, key: keyof SavePersonalInfoRequest, value: any) => {
    setUpdateRequest({
      label,
      key,
      currentValue: value || '',
      newValue: ''
    })
    setIsModalOpen(true)
  }

  const isFieldLocked = (field: keyof SavePersonalInfoRequest) => {
    const dbValue = (apiData as any)?.[field];
    // LOCKED_PERSONAL_FIELDS is declared as an empty array literal (inferred as `never[]`)
    // in config/profileLockFields.ts; widen it here so `.includes()` accepts a real field key.
    return (LOCKED_PERSONAL_FIELDS as string[]).includes(field) && dbValue !== null && dbValue !== undefined && dbValue !== '';
  }

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
  const getFieldError = (fieldName: string): string[] | undefined => {
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
          <div className="position-relative">
            <input
              type="text"
              className={`form-control ${hasError('first_name') ? 'is-invalid' : ''} ${isFieldLocked('first_name') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter first name"
              value={data.first_name}
              onChange={(e) => onChange({ ...data, first_name: e.target.value })}
              required
              readOnly={isFieldLocked('first_name')}
            />
            {isFieldLocked('first_name') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute end-0 top-0 mt-1 me-1 shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('First Name', 'first_name', data.first_name)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('first_name') && (
            <div className="invalid-feedback d-block">{getFieldError('first_name')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              className={`form-control ${hasError('last_name') ? 'is-invalid' : ''} ${isFieldLocked('last_name') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter last name"
              value={data.last_name}
              onChange={(e) => onChange({ ...data, last_name: e.target.value })}
              required
              readOnly={isFieldLocked('last_name')}
            />
            {isFieldLocked('last_name') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute end-0 top-0 mt-1 me-1 shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Last Name', 'last_name', data.last_name)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('last_name') && (
            <div className="invalid-feedback d-block">{getFieldError('last_name')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Email <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="email"
              className={`form-control ${hasError('email') ? 'is-invalid' : ''} ${isFieldLocked('email') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter email id"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              required
              readOnly={isFieldLocked('email')}
            />
            {isFieldLocked('email') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Email Address', 'email', data.email)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('email') && (
            <div className="invalid-feedback d-block">{getFieldError('email')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone Number <span className="text-danger">*</span></label>
          <div className="position-relative">
            <div className="input-group">
              <span className="input-group-text bg-light border">
                <span className="me-1">{selectedCountry?.code || 'US'}</span>
                <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
              </span>
              <input
                type="tel"
                className={`form-control ${hasError('phone_number') ? 'is-invalid' : ''} ${isFieldLocked('phone_number') ? 'bg-light border-dashed locked-field-padding' : ''}`}
                placeholder="(555) 555-5555"
                value={data.phone_number}
                onChange={(e) => onChange({ ...data, phone_number: formatPhoneNumber(e.target.value) })}
                required
                readOnly={isFieldLocked('phone_number')}
              />
            </div>
            {isFieldLocked('phone_number') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Phone Number', 'phone_number', data.phone_number)}
              >
                Change Request
              </button>
            )}
            {hasError('phone_number') && (
              <div className="invalid-feedback d-block">{getFieldError('phone_number')}</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Home Address <span className="text-danger">*</span></label>
          <div className="position-relative">
            <textarea
              className={`form-control ${hasError('home_address') ? 'is-invalid' : ''} ${isFieldLocked('home_address') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter address"
              rows={1}
              value={data.home_address}
              onChange={(e) => onChange({ ...data, home_address: e.target.value })}
              required
              readOnly={isFieldLocked('home_address')}
            />
            {isFieldLocked('home_address') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Home Address', 'home_address', data.home_address)}
              >
                Change Request
              </button>
            )}
            {hasError('home_address') && (
              <div className="invalid-feedback d-block">{getFieldError('home_address')}</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Country <span className="text-danger">*</span></label>
          <div className="position-relative">
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
              searchable={true}
              className={`w-100 ${hasError('country') ? 'is-invalid' : ''} ${isFieldLocked('country') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={isFieldLocked('country')}
            />
            {isFieldLocked('country') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Country', 'country', data.country)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('country') && (
            <div className="invalid-feedback d-block">{getFieldError('country')}</div>
          )}
        </div>


        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <div className="position-relative">
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
              className={`w-100 ${hasError('state') ? 'is-invalid' : ''} ${isFieldLocked('state') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={!data.country || isFieldLocked('state')}
            />
            {isFieldLocked('state') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('State', 'state', data.state)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('state') && (
            <div className="invalid-feedback d-block">{getFieldError('state')}</div>
          )}
        </div>


        <div className={showCityInput ? "col-md-3" : "col-md-6"}>
          <label className="form-label">City <span className="text-danger">*</span></label>
          <div className="position-relative">
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
              className={`w-100 ${hasError('city') ? 'is-invalid' : ''} ${isFieldLocked('city') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={!data.state || isFieldLocked('city')}
            />
            {isFieldLocked('city') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('City', 'city', data.city)}
              >
                Change Request
              </button>
            )}
            {hasError('city') && (
              <div className="invalid-feedback d-block">{getFieldError('city')}</div>
            )}
          </div>

        </div>

        {showCityInput && (
          <div className="col-md-3">
            <label className="form-label">City Name <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              className={`form-control ${hasError('city') ? 'is-invalid' : ''} ${isFieldLocked('city') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter city name"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              required
              readOnly={isFieldLocked('city')}
            />
            {isFieldLocked('city') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('City Name', 'city', data.city)}
              >
                Change Request
              </button>
            )}
            {hasError('city') && (
              <div className="invalid-feedback d-block">{getFieldError('city')}</div>
            )}
          </div>
          </div>
        )}



        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              className={`form-control ${hasError('zip_code') ? 'is-invalid' : ''} ${isFieldLocked('zip_code') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter zip code"
              value={data.zip_code}
              onChange={(e) => onChange({ ...data, zip_code: formatZipCode(e.target.value) })}
              required
              readOnly={isFieldLocked('zip_code')}
            />
            {isFieldLocked('zip_code') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Zip Code', 'zip_code', data.zip_code)}
              >
                Change Request
              </button>
            )}
            {hasError('zip_code') && (
              <div className="invalid-feedback d-block">{getFieldError('zip_code')}</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Home Phone </label>
          <div className="position-relative">
            <div className="input-group">
              <span className="input-group-text bg-light border">
                <span className="me-1">{selectedCountry?.code || 'US'}</span>
                <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
              </span>
              <input
                type="tel"
                className={`form-control ${hasError('home_phone') ? 'is-invalid' : ''} ${isFieldLocked('home_phone') ? 'bg-light border-dashed locked-field-padding' : ''}`}
                placeholder="(555) 555-5555"
                value={data.home_phone}
                onChange={(e) => onChange({ ...data, home_phone: formatPhoneNumber(e.target.value) })}
                readOnly={isFieldLocked('home_phone')}
              />
            </div>
            {isFieldLocked('home_phone') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Home Phone', 'home_phone', data.home_phone)}
              >
                Change Request
              </button>
            )}
            {hasError('home_phone') && (
              <div className="invalid-feedback d-block">{getFieldError('home_phone')}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
          <div className="position-relative">
            <Flatpickr
              className={`form-control ${hasError('date_of_birth') ? 'is-invalid' : ''} ${isFieldLocked('date_of_birth') ? 'bg-light border-dashed' : ''}`}
              value={data.date_of_birth}
              onChange={(dates, dateStr) => {
                onChange({ ...data, date_of_birth: dateStr })
              }}
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "j M, Y",
                  maxDate: "today",
                  yearRange: "1900:" + new Date().getFullYear(),
                  monthSelectorType: "dropdown",
                  clickOpens: !isFieldLocked('date_of_birth'),
                  plugins: [yearDropdownPlugin(1900)],
                } as any}
              placeholder="Select date of birth"
              disabled={isFieldLocked('date_of_birth')}
            />
            {isFieldLocked('date_of_birth') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Date of Birth', 'date_of_birth', data.date_of_birth)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('date_of_birth') && (
            <div className="invalid-feedback d-block">{getFieldError('date_of_birth')}</div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Last 4 SSN <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="password"
              className={`form-control ${hasError('last_4_ssn') ? 'is-invalid' : ''} ${isFieldLocked('last_4_ssn') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              placeholder="Enter last 4 digits"
              value={data.last_4_ssn}
              onChange={(e) => onChange({ ...data, last_4_ssn: formatLast4SSN(e.target.value) })}
              maxLength={4}
              required
              readOnly={isFieldLocked('last_4_ssn')}
            />
            {isFieldLocked('last_4_ssn') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Last 4 SSN', 'last_4_ssn', data.last_4_ssn)}
              >
                Change Request
              </button>
            )}
          </div>
          {hasError('last_4_ssn') && (
            <div className="invalid-feedback d-block">{getFieldError('last_4_ssn')}</div>
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

      {/* Update Request Modal */}
      <Modal
        isOpen={isModalOpen}
        toggle={toggleModal}
        centered
        onOpened={() => inputRef.current?.focus()}
      >
        <ModalHeader toggle={toggleModal}>Change Request: {updateRequest.label}</ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <label className="form-label text-muted">Current Value</label>
            <input
              type="text"
              className="form-control bg-light"
              value={updateRequest.key === 'date_of_birth' && updateRequest.currentValue
                // Not new Date(): that parses a bare calendar date as UTC
                // midnight, so anywhere behind UTC this showed the previous day.
                // A date of birth is the same date in every timezone.
                ? formatCalendarDate(String(updateRequest.currentValue))
                : (updateRequest.key === 'phone_number' ? formatPhoneNumber(String(updateRequest.currentValue))
                  : updateRequest.currentValue)}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Requested New Value <span className="text-danger">*</span></label>
            {updateRequest.key === 'date_of_birth' ? (
              <Flatpickr
                className={`form-control w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
                value={updateRequest.newValue}
                onChange={(dates, dateStr) => setUpdateRequest({ ...updateRequest, newValue: dateStr })}
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "j M, Y",
                  maxDate: "today",
                  monthSelectorType: "dropdown",
                  static: true,
                  plugins: [yearDropdownPlugin(1900)],
                }}
                placeholder="Select date of birth"
              />
            ) : updateRequest.key === 'country' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={countriesData}
                optionLabel="name"
                optionValue="name"
                placeholder="Select country"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : updateRequest.key === 'state' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={availableStates}
                optionLabel="name"
                optionValue="name"
                placeholder="Select state"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : updateRequest.key === 'city' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={availableCities.filter(c => c.code !== 'Others')}
                optionLabel="name"
                optionValue="code"
                placeholder="Select city"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : (
              <input
                ref={inputRef}
                type={updateRequest.key === 'email' ? 'email' : 'text'}
                className={`form-control w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
                placeholder={`Enter the updated ${updateRequest.label}`}
                value={updateRequest.newValue}
                onChange={(e) => {
                  let val = e.target.value;
                  if (updateRequest.key === 'phone_number') val = formatPhoneNumber(val);
                  if (updateRequest.key === 'last_4_ssn') val = formatLast4SSN(val);
                  if (updateRequest.key === 'zip_code') val = formatZipCode(val);
                  setUpdateRequest({ ...updateRequest, newValue: val });
                }}
                maxLength={updateRequest.key === 'phone_number' ? 14 : (updateRequest.key === 'last_4_ssn' ? 4 : undefined)}
              />
            )}
            {modalErrors.new_value && (
              <div className="invalid-feedback d-block mt-1">
                {Array.isArray(modalErrors.new_value) ? modalErrors.new_value[0] : modalErrors.new_value}
              </div>
            )}
          </div>
          <div className="alert alert-info border-0 mb-0">
            <div className="d-flex">
              <div className="flex-shrink-0">
                <i className="ri-information-line fs-18"></i>
              </div>
              <div className="flex-grow-1 ms-2">
                <p className="mb-0 fs-13">
                  This field is verified and locked. Submitting this form will notify our compliance team to review and verify the new information before it is updated.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-ghost-danger" onClick={toggleModal}>Discard</button>
          <button
            className="btn btn-primary px-4"
            disabled={!updateRequest.newValue || isSubmittingChange}
            onClick={() => {
              let finalNewValue = updateRequest.newValue;

              submitChange({
                field_name: updateRequest.key,
                new_value: finalNewValue,
              }, {
                onSuccess: (response) => {
                  if (response.status) {
                    toast.success(response.message);
                    toggleModal();
                  } else {
                    if (response.errors) {
                      setModalErrors(response.errors);
                    } else {
                      toast.error(response.message);
                    }
                  }
                },
                onError: (error: any) => {
                  if (error.response?.data?.errors) {
                    setModalErrors(error.response.data.errors);
                  } else {
                    toast.error('Failed to submit change request');
                  }
                }
              });
            }}
          >
            {isSubmittingChange ? 'Submitting...' : 'Submit for Review'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

