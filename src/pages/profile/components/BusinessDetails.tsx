import React from 'react'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { SaveBusinessDetailsRequest, ValidationErrors, BusinessDetailsData } from '../../../modules/profile/types'
import { countries as countriesData } from '../../../data/countries'
import { entityTypes, industryTypes } from '../../../data/profile'
import { useBusinessDetails, useSaveBusinessDetails, useSubmitChangeRequest } from '../../../modules/profile/queries'
import { useEffect, useMemo, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import TabLoader from '../../../components/Loader/TabLoader'
import { formatPhoneNumber, formatDUNS, formatEIN, unformatEIN, unformatPhoneNumber, formatZipCode } from '../../../utils/formatters'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { LOCKED_BUSINESS_FIELDS } from '../../../config/profileLockFields'

interface BusinessDetailsProps {
  data: SaveBusinessDetailsRequest
  onChange: (data: SaveBusinessDetailsRequest) => void
  onSave: () => void
  onBack: () => void
}

export default function BusinessDetails({ data, onChange, onSave, onBack }: BusinessDetailsProps) {

  const { data: apiData, isLoading, isSuccess } = useBusinessDetails()
  const { mutate: saveBusiness, isPending } = useSaveBusinessDetails()
  const { mutate: submitChange, isPending: isSubmittingChange } = useSubmitChangeRequest()
  const [errors, setErrors] = useState<ValidationErrors>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const [availableCities, setAvailableCities] = useState<{ name: string, code: string }[]>([])
  const [availableStates, setAvailableStates] = useState<{ name: string, code: string, cities?: string[] }[]>([])
  const [showCityInput, setShowCityInput] = useState(false)

  // Update Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updateRequest, setUpdateRequest] = useState({
    label: '',
    key: '' as keyof SaveBusinessDetailsRequest,
    currentValue: '',
    newValue: ''
  })
  const [modalErrors, setModalErrors] = useState<Record<string, string[]>>({})

  const toggleModal = () => {
    if (isModalOpen) setModalErrors({})
    setIsModalOpen(!isModalOpen)
  }

  const handleOpenRequestModal = (label: string, key: keyof SaveBusinessDetailsRequest, value: any) => {
    setUpdateRequest({
      label,
      key,
      currentValue: value || '',
      newValue: ''
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    setErrors({})
    const payload = {
      ...data,
      business_ein: data.business_ein,
      business_phone: data.business_phone,
      duns_number: data.duns_number.replace(/\D/g, ''),
    }

    // Remove read-only fields from payload
    const { business_credit_score, ...finalPayload } = payload;

    saveBusiness(finalPayload as any, {
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
      const selectedCountry = countriesData.find(c => c.name === apiData.country)
      onChange({
        ...data,
        business_name: apiData.business_name,
        business_ein: formatEIN(apiData.business_ein),
        business_phone: formatPhoneNumber(apiData.business_phone),
        business_email: apiData.business_email,
        duns_number: formatDUNS(apiData.duns_number),
        business_address: apiData.business_address,
        business_city: apiData.business_city,
        business_state: apiData.business_state,
        business_country: apiData.country,
        business_country_code: selectedCountry ? selectedCountry.phone_code : (apiData.country_code || ''),
        business_zip_code: apiData.business_postal_code,
        business_website: apiData.business_website,
        business_entity_type: apiData.business_entity_type,
        business_industry_type: apiData.business_industry_type,
        business_start_date: apiData.business_start_date,
        business_credit_score: apiData.business_credit_score,
        personal_credit_score: apiData.personal_credit_score,
      })
    }
  }, [isSuccess, apiData])

  // Update phone country codes when country changes
  useEffect(() => {
    if (data.business_country) {
      const country = countriesData.find(c => c.name === data.business_country)
      if (country && data.business_country_code !== country.phone_code) {
        onChange({
          ...data,
          business_country_code: country.phone_code
        })
      }
    }
  }, [data.business_country])

  // Update available states when country changes
  useEffect(() => {
    if (data.business_country) {
      const selectedCountry = countriesData.find(c => c.name === data.business_country)
      if (selectedCountry) {
        setAvailableStates(selectedCountry.states)
      } else {
        setAvailableStates([])
      }
    } else {
      setAvailableStates([])
    }
  }, [data.business_country])

  // Update available cities when state changes
  useEffect(() => {
    if (data.business_state) {
      // Find state in availableStates instead of assuming US
      const selectedState = availableStates.find(s => s.name === data.business_state)

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
  }, [data.business_state, availableStates])

  // Sync showCityInput with business_city
  useEffect(() => {
    if (data.business_city && availableCities.length > 0) {
      const exists = availableCities.find(c => c.code === data.business_city && c.code !== 'Others')
      if (!exists) {
        setShowCityInput(true)
      } else {
        setShowCityInput(false)
      }
    }
  }, [data.business_city, availableCities])

  const selectedCountry = useMemo(() => {
    return data.business_country ? countriesData.find(c => c.name === data.business_country) : undefined
  }, [data.business_country])

  const isFieldLocked = (field: keyof SaveBusinessDetailsRequest) => {
    // Map request keys to API data keys if they differ
    const keyMap: Record<string, string> = {
      'business_country': 'country',
      'business_country_code': 'country_code',
      'business_zip_code': 'business_postal_code',
    };

    const apiKey = keyMap[field] || field;
    const dbValue = (apiData as any)?.[apiKey];

    return LOCKED_BUSINESS_FIELDS.includes(field) && dbValue !== null && dbValue !== undefined && dbValue !== '';
  }


  if (isLoading) {
    return <TabLoader count={10} colClass="col-md-6" />
  }

  return (
    <div className="fade-panel">

      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Legal Business Name <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="Enter business name"
              value={data.business_name}
              onChange={(e) => onChange({ ...data, business_name: e.target.value })}
              className={`form-control ${errors.business_name ? 'is-invalid' : ''} ${isFieldLocked('business_name') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('business_name')}
            />
            {isFieldLocked('business_name') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Legal Business Name', 'business_name', data.business_name)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_name && <div className="invalid-feedback d-block">{errors.business_name}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center justify-content-between w-100">
            <span>Business EIN <span className="text-danger">*</span></span>
          </label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="9 digit EIN"
              value={data.business_ein}
              onChange={(e) => onChange({ ...data, business_ein: formatEIN(e.target.value) })}
              className={`form-control ${errors.business_ein ? 'is-invalid' : ''} ${isFieldLocked('business_ein') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              maxLength={10}
              readOnly={isFieldLocked('business_ein')}
            />
            {isFieldLocked('business_ein') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Business EIN', 'business_ein', data.business_ein)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_ein && <div className="invalid-feedback d-block">{errors.business_ein}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center justify-content-between w-100">
            <span>Phone Number </span>
          </label>
          <div className="position-relative">
            <div className="input-group">
              <span className="input-group-text bg-light border">
                <span className="me-1">{selectedCountry?.code || 'USA'}</span>
                <span className="text-muted">{selectedCountry?.phone_code || '+1'}</span>
              </span>
              <input
                type="tel"
                className={`form-control ${errors.business_phone ? 'is-invalid' : ''} ${isFieldLocked('business_phone') ? 'bg-light border-dashed locked-field-padding' : ''}`}
                placeholder="(123) 456-7890"
                value={data.business_phone}
                onChange={(e) => onChange({ ...data, business_phone: formatPhoneNumber(e.target.value) })}
                maxLength={14}
                required
                readOnly={isFieldLocked('business_phone')}
              />
            </div>
            {isFieldLocked('business_phone') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Phone Number', 'business_phone', data.business_phone)}
              >
                Change Request
              </button>
            )}
            {errors.business_phone && <div className="invalid-feedback d-block">{errors.business_phone}</div>}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center justify-content-between w-100">
            <span>Business Email <span className="text-danger">*</span></span>
          </label>
          <div className="position-relative">
            <input
              type="email"
              placeholder="Enter business email"
              value={data.business_email}
              onChange={(e) => onChange({ ...data, business_email: e.target.value })}
              className={`form-control ${errors.business_email ? 'is-invalid' : ''} ${isFieldLocked('business_email') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('business_email')}
            />
            {isFieldLocked('business_email') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Business Email', 'business_email', data.business_email)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_email && <div className="invalid-feedback d-block">{errors.business_email}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center justify-content-between w-100">
            <span>DUNS Number</span>
          </label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="9 digit DUNS Number"
              value={data.duns_number}
              onChange={(e) => onChange({ ...data, duns_number: formatDUNS(e.target.value) })}
              className={`form-control ${errors.duns_number ? 'is-invalid' : ''} ${isFieldLocked('duns_number') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              maxLength={9}
              readOnly={isFieldLocked('duns_number')}
            />
            {isFieldLocked('duns_number') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('DUNS Number', 'duns_number', data.duns_number)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.duns_number && <div className="invalid-feedback d-block">{errors.duns_number}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label d-flex align-items-center justify-content-between w-100">
            <span>Business Address <span className="text-danger">*</span></span>
          </label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="Enter business address"
              value={data.business_address}
              onChange={(e) => onChange({ ...data, business_address: e.target.value })}
              className={`form-control ${errors.business_address ? 'is-invalid' : ''} ${isFieldLocked('business_address') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('business_address')}
            />
            {isFieldLocked('business_address') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Business Address', 'business_address', data.business_address)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_address && <div className="invalid-feedback d-block">{errors.business_address}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Country <span className="text-danger">*</span></label>
          <div className="position-relative">
            <CustomDropdown
              value={data.business_country}
              onChange={(value) => {
                const selectedCountryObj = countriesData.find(c => c.name === value)
                onChange({
                  ...data,
                  business_country: value,
                  business_country_code: selectedCountryObj ? selectedCountryObj.phone_code : '',
                  business_state: '', // Reset state when country changes
                  business_city: '' // Reset city when country changes
                })
              }}
              options={countriesData}
              optionLabel="name"
              optionValue="name"
              placeholder="Select country"
              searchable={true}
              className={`w-100 ${errors.business_country ? 'is-invalid' : ''} ${isFieldLocked('business_country') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={isFieldLocked('business_country')}
            />
            {isFieldLocked('business_country') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Country', 'business_country', data.business_country)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_country && (
            <div className="invalid-feedback d-block">{errors.business_country}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
          <div className="position-relative">
            <CustomDropdown
              value={data.business_state}
              onChange={(value) => {
                const selectedStateObj = availableStates.find(s => s.name === value)
                let defaultCity = ''
                if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
                  defaultCity = selectedStateObj.cities[0]
                }
                onChange({ ...data, business_state: value, business_city: defaultCity })
              }}
              options={availableStates}
              optionLabel="name"
              optionValue="name"
              searchable={true}
              placeholder="Select state"
              className={`w-100 ${errors.business_state ? 'is-invalid' : ''} ${isFieldLocked('business_state') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={!data.business_country || isFieldLocked('business_state')}
            />
            {isFieldLocked('business_state') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('State', 'business_state', data.business_state)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_state && <div className="invalid-feedback d-block">{errors.business_state}</div>}
        </div>

        <div className={showCityInput ? "col-md-3" : "col-md-6"}>
          <label className="form-label">City <span className="text-danger">*</span></label>
          <div className="position-relative">
            <CustomDropdown
              value={showCityInput ? 'Others' : data.business_city}
              onChange={(value) => {
                if (value === 'Others') {
                  setShowCityInput(true)
                  onChange({ ...data, business_city: '' })
                } else {
                  setShowCityInput(false)
                  onChange({ ...data, business_city: value })
                }
              }}
              options={availableCities}
              optionLabel="name"
              optionValue="code"
              placeholder="Select city"
              searchable={true}
              className={`w-100 ${errors.business_city ? 'is-invalid' : ''} ${isFieldLocked('business_city') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={!data.business_state || isFieldLocked('business_city')}
            />
            {isFieldLocked('business_city') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('City', 'business_city', data.business_city)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_city && !showCityInput && (
            <div className="invalid-feedback d-block">{errors.business_city}</div>
          )}
        </div>

        {showCityInput && (
          <div className="col-md-3">
            <label className="form-label">City Name <span className="text-danger">*</span></label>
            <div className="position-relative">
              <input
                type="text"
                className={`form-control ${errors.business_city ? 'is-invalid' : ''} ${isFieldLocked('business_city') ? 'bg-light border-dashed locked-field-padding' : ''}`}
                placeholder="Enter city name"
                value={data.business_city}
                onChange={(e) => onChange({ ...data, business_city: e.target.value })}
                required
                readOnly={isFieldLocked('business_city')}
              />
              {isFieldLocked('business_city') && (
                <button
                  className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                  type="button"
                  onClick={() => handleOpenRequestModal('City Name', 'business_city', data.business_city)}
                >
                  Change Request
                </button>
              )}
              {errors.business_city && (
                <div className="invalid-feedback d-block">{errors.business_city}</div>
              )}
            </div>
          </div>
        )}


        <div className="col-md-6">
          <label className="form-label">Zip Code <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="text"
              placeholder="Enter zip code"
              value={data.business_zip_code}
              onChange={(e) => onChange({ ...data, business_zip_code: formatZipCode(e.target.value) })}
              className={`form-control ${errors.business_zip_code ? 'is-invalid' : ''} ${isFieldLocked('business_zip_code') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('business_zip_code')}
            />
            {isFieldLocked('business_zip_code') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Zip Code', 'business_zip_code', data.business_zip_code)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_zip_code && <div className="invalid-feedback d-block">{errors.business_zip_code}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Entity Type <span className="text-danger">*</span></label>
          <div className="position-relative">
            <CustomDropdown
              searchable={true}
              value={data.business_entity_type}
              onChange={(value) => onChange({ ...data, business_entity_type: value })}
              options={entityTypes}
              optionLabel="label"
              optionValue="value"
              placeholder="Select entity type"
              className={`w-100 ${errors.business_entity_type ? 'is-invalid' : ''} ${isFieldLocked('business_entity_type') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={isFieldLocked('business_entity_type')}
            />
            {isFieldLocked('business_entity_type') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Entity Type', 'business_entity_type', data.business_entity_type)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_entity_type && <div className="invalid-feedback d-block">{errors.business_entity_type}</div>}
        </div>


        {/* New Field: Business Start Date */}
        <div className="col-md-6">
          <label className="form-label">Business Start Date <span className="text-danger">*</span></label>
          <div className="position-relative">
            <Flatpickr
              className={`form-control ${errors.business_start_date ? 'is-invalid' : ''} ${isFieldLocked('business_start_date') ? 'bg-light border-dashed' : ''}`}
              value={data.business_start_date || ''}
              onChange={(dates, dateStr) => {
                onChange({ ...data, business_start_date: dateStr })
              }}
              options={{
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "j M, Y",
                maxDate: "today",
                yearRange: "1900:" + new Date().getFullYear(),
                monthSelectorType: "dropdown",
                clickOpens: !isFieldLocked('business_start_date'),
                plugins: [yearDropdownPlugin(1900)],
              } as any}
              placeholder="Select business start date"
              disabled={isFieldLocked('business_start_date')}
            />
            {isFieldLocked('business_start_date') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Business Start Date', 'business_start_date', data.business_start_date)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_start_date && (
            <div className="invalid-feedback d-block">{errors.business_start_date}</div>
          )}
        </div>

        {/* New Field: Personal Credit Score */}
        <div className="col-md-6">
          <label className="form-label">Personal Credit Score <span className="text-danger">*</span></label>
          <div className="position-relative">
            <input
              type="number"
              placeholder="Enter personal credit score"
              className={`form-control ${errors.personal_credit_score ? 'is-invalid' : ''} ${isFieldLocked('personal_credit_score') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              value={data.personal_credit_score || ''}
              onChange={(e) => onChange({ ...data, personal_credit_score: Number(e.target.value) })}
              min={300}
              max={850}
              readOnly={isFieldLocked('personal_credit_score')}
            />
            {isFieldLocked('personal_credit_score') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Personal Credit Score', 'personal_credit_score', data.personal_credit_score)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.personal_credit_score && (
            <div className="invalid-feedback d-block">{errors.personal_credit_score}</div>
          )}
        </div>

        {/* New Field: Business Credit Score */}
        <div className="col-md-6">
          <label className="form-label">Business Credit Score</label>
          <div className="position-relative">
            <input
              type="number"
              placeholder="Not available"
              className="form-control bg-light border-dashed locked-field-padding"
              value={data.business_credit_score || ''}
              min={0}
              max={850}
              readOnly={true}
            />
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label d-flex align-items-center justify-content-between w-100">
            <span>Business Website</span>
          </label>
          <div className="position-relative">
            <input
              type="url"
              placeholder="https://example.com"
              value={data.business_website}
              onChange={(e) => onChange({ ...data, business_website: e.target.value })}
              className={`form-control ${errors.business_website ? 'is-invalid' : ''} ${isFieldLocked('business_website') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              readOnly={isFieldLocked('business_website')}
            />
            {isFieldLocked('business_website') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Business Website', 'business_website', data.business_website)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_website && <div className="invalid-feedback d-block">{errors.business_website}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Industry Type <span className="text-danger">*</span></label>
          <div className="position-relative">
            <CustomDropdown
              value={data.business_industry_type}
              onChange={(value) => onChange({ ...data, business_industry_type: value })}
              options={industryTypes}
              optionLabel="label"
              optionValue="value"
              searchable={true}
              placeholder="Select industry type"
              className={`w-100 ${errors.business_industry_type ? 'is-invalid' : ''} ${isFieldLocked('business_industry_type') ? 'bg-light border-dashed locked-field-padding' : ''}`}
              disabled={isFieldLocked('business_industry_type')}
            />
            {isFieldLocked('business_industry_type') && (
              <button
                className="btn btn-sm btn-soft-primary position-absolute shadow-none change-request-btn z-4"
                type="button"
                onClick={() => handleOpenRequestModal('Industry Type', 'business_industry_type', data.business_industry_type)}
              >
                Change Request
              </button>
            )}
          </div>
          {errors.business_industry_type && <div className="invalid-feedback d-block">{errors.business_industry_type}</div>}
        </div>
        <div className="col-12 d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-warning" onClick={onBack}>Previous</button>
          <button type="button" className="btn primary-btn" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
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
              value={updateRequest.key === 'business_start_date' && updateRequest.currentValue
                ? new Date(updateRequest.currentValue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : (updateRequest.key === 'business_ein' ? formatEIN(String(updateRequest.currentValue))
                  : (updateRequest.key === 'duns_number' ? formatDUNS(String(updateRequest.currentValue))
                    : (updateRequest.key === 'business_phone' ? formatPhoneNumber(String(updateRequest.currentValue))
                      : updateRequest.currentValue)))}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Requested New Value <span className="text-danger">*</span></label>
            {updateRequest.key === 'business_start_date' ? (
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
                placeholder="Select business start date"
              />
            ) : updateRequest.key === 'business_country' ? (
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
            ) : updateRequest.key === 'business_state' ? (
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
            ) : updateRequest.key === 'business_city' ? (
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
            ) : updateRequest.key === 'business_entity_type' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={entityTypes}
                optionLabel="label"
                optionValue="value"
                placeholder="Select entity type"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : updateRequest.key === 'business_industry_type' ? (
              <CustomDropdown
                searchable={true}
                value={updateRequest.newValue}
                onChange={(val) => setUpdateRequest({ ...updateRequest, newValue: val })}
                options={industryTypes}
                optionLabel="label"
                optionValue="value"
                placeholder="Select industry type"
                className={`w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
              />
            ) : (
              <input
                ref={inputRef}
                type={(updateRequest.key === 'business_credit_score' || updateRequest.key === 'personal_credit_score') ? 'number' : 'text'}
                className={`form-control w-100 ${modalErrors.new_value ? 'is-invalid' : ''}`}
                placeholder={`Enter the updated ${updateRequest.label}`}
                value={updateRequest.newValue}
                onChange={(e) => {
                  let val = e.target.value;
                  if (updateRequest.key === 'business_ein') val = formatEIN(val);
                  if (updateRequest.key === 'duns_number') val = formatDUNS(val);
                  if (updateRequest.key === 'business_phone') val = formatPhoneNumber(val);
                  if (updateRequest.key === 'business_zip_code') val = formatZipCode(val);
                  setUpdateRequest({ ...updateRequest, newValue: val });
                }}
                maxLength={(updateRequest.key === 'business_ein') ? 10 : (updateRequest.key === 'duns_number' ? 9 : (updateRequest.key === 'business_phone' ? 14 : undefined))}
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
          <button className="btn btn-danger-subtle" onClick={toggleModal}>Discard</button>
          <button
            className="btn btn-primary px-4"
            disabled={!updateRequest.newValue || isSubmittingChange}
            onClick={() => {
              let finalNewValue = updateRequest.newValue;
              if (updateRequest.key === 'duns_number') finalNewValue = finalNewValue.replace(/\D/g, '');

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
