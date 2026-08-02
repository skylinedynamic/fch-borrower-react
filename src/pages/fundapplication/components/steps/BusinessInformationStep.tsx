import React, { useState, useEffect, useCallback } from 'react'
import type { PersonalInfo, BusinessDetails } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CustomDropdown from '../../../../components/Common/CustomDropdown'
import { entityTypes, industryTypes, yearsInBusinessOptions } from '../../../../data/profile'
import { countries as countriesData } from '../../../../data/countries'
import { useBusinessInfo, useSaveBusinessInfo } from '../../../../modules/funding-application/queries'
import { formatPhoneNumber, formatNumber } from '../../../../utils/formatters'
import { getCountryCodeByName, getPhoneCodeByName, formatCountryDisplay, getCountryCodeFromDisplay } from '../../../../utils/countryHelpers'
import { toast } from 'react-toastify'

interface BusinessInformationStepProps {
  personal: PersonalInfo
  setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>
  business: BusinessDetails
  setBusiness: React.Dispatch<React.SetStateAction<BusinessDetails>>
  canProceed: boolean
  onNext: () => void
  loading: boolean
  onRegisterSave?: (fn: (() => Promise<boolean>) | null) => void
  fundingSequenceId?: number | string | null
  fundingRequestId?: number | string | null
}

export default function BusinessInformationStep({
  personal,
  setPersonal,
  business,
  setBusiness,
  canProceed,
  onNext,
  loading,
  onRegisterSave,
  fundingSequenceId,
  fundingRequestId,
}: BusinessInformationStepProps) {
  const [availableStates, setAvailableStates] = useState<{ name: string; code: string; cities?: string[] }[]>([])
  const [availableCities, setAvailableCities] = useState<{ name: string; code: string }[]>([])
  const [showCityInput, setShowCityInput] = useState(false)
  const [lastCustomCity, setLastCustomCity] = useState('')
  const [businessInfoId, setBusinessInfoId] = useState<number | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { data: apiData, isLoading: isApiLoading, isSuccess } = useBusinessInfo()
  const { mutateAsync: saveBusinessInfo, isPending: isSaving } = useSaveBusinessInfo()

  // Memoized save handler
  const handleSave = useCallback(async (): Promise<boolean> => {
    setValidationErrors({})

    const countryCode = getCountryCodeFromDisplay(personal.phoneCountry)
    const selectedCountry = countriesData.find((c) => c.code === countryCode)

    const payload = {
      id: businessInfoId,
      full_name: personal.fullName,
      business_name: personal.businessName,
      business_email: personal.email,
      business_phone_no: personal.phoneNumber,
      business_country: selectedCountry?.name || null,
      business_country_code: selectedCountry?.phone_code || null,
      business_address: business.businessAddress,
      business_city: business.city,
      business_state: business.state,
      business_postal_code: business.zip,
      industry_type: business.industryType,
      entity_type: business.entityType,
      years_in_business: business.yearsInBusiness,
      number_of_employees: business.employees ? parseInt(business.employees) : null,
      funding_sequence_id: fundingSequenceId || apiData?.funding_sequence_id || null,
      funding_request_id: fundingRequestId || apiData?.funding_request_id || null,
    }

    try {
      await saveBusinessInfo(payload as any)
      return true
    } catch (error: any) {
      const errors = error.response?.data?.errors
      if (errors) {
        setValidationErrors(errors)
      } else {
        toast.error(error.response?.data?.message || 'Failed to save business information. Please try again.')
      }
      return false
    }
  }, [businessInfoId, personal, business, saveBusinessInfo, fundingSequenceId, fundingRequestId, apiData])

  // Register save function
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(handleSave)
    }
    return () => {
      if (onRegisterSave) onRegisterSave(null)
    }
  }, [onRegisterSave, handleSave])

  // Pre-fill form from API
  useEffect(() => {
    if (isSuccess && apiData) {
      setBusinessInfoId(apiData.id || null)

      // Derive phone display string
      let phoneDisplay = 'USA (+1)' // default
      if (apiData.business_country) {
        const code = getCountryCodeByName(apiData.business_country)
        const phoneCode = apiData.business_country_code || getPhoneCodeByName(apiData.business_country)

        if (code && phoneCode) {
          phoneDisplay = formatCountryDisplay(code, phoneCode)
        }
      } else if (apiData.country_code || apiData.country) {
        // Fallback to old property names if business_country is missing
        const code = apiData.country_code || (apiData.country === 'United States' ? 'USA' : 'CAN')
        const phoneCode = '+1' // Assuming +1 for default fallback logic as before
        phoneDisplay = formatCountryDisplay(code, phoneCode)
      }

      setPersonal((prev) => ({
        ...prev,
        fullName: apiData.full_name || prev.fullName,
        businessName: apiData.business_name || prev.businessName,
        email: apiData.business_email || prev.email,
        phoneNumber: apiData.business_phone_no || prev.phoneNumber,
        phoneCountry: phoneDisplay,
      }))
      setBusiness((prev) => ({
        ...prev,
        businessName: apiData.business_name || prev.businessName,
        businessAddress: apiData.business_address || prev.businessAddress,
        city: apiData.business_city || prev.city,
        state: apiData.business_state || prev.state,
        incorporationState: apiData.business_state || prev.incorporationState,
        zip: apiData.business_postal_code || prev.zip,
        industryType: apiData.industry_type || prev.industryType,
        entityType: apiData.entity_type || prev.entityType,
        yearsInBusiness: apiData.years_in_business || prev.yearsInBusiness,
        employees: apiData.number_of_employees || prev.employees,
      }))
    }
  }, [isSuccess, apiData, setPersonal, setBusiness])

  // Helper to get field error
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  // Helper to check if field has error
  const hasError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName]
  }

  // Update available states when country changes
  useEffect(() => {
    const countryCode = getCountryCodeFromDisplay(personal.phoneCountry)
    const selectedCountry = countriesData.find((c) => c.code === countryCode)
    if (selectedCountry) {
      setAvailableStates(selectedCountry.states)
    } else {
      setAvailableStates([])
    }
  }, [personal.phoneCountry])

  // Update available cities when state changes
  useEffect(() => {
    if (business.state) {
      const selectedState = availableStates.find((s) => s.name === business.state || s.code === business.state)
      if (selectedState && selectedState.cities) {
        const cities = selectedState.cities.map((city) => ({ name: city, code: city }))
        cities.push({ name: 'Others', code: 'Others' })
        setAvailableCities(cities)
      } else {
        setAvailableCities([{ name: 'Others', code: 'Others' }])
      }
    } else {
      setAvailableCities([])
    }
  }, [business.state, availableStates])

  // Sync showCityInput with business.city
  useEffect(() => {
    if (business.city && availableCities.length > 0) {
      const exists = availableCities.find((c) => c.code === business.city && c.code !== 'Others')
      if (!exists) {
        setShowCityInput(true)
        setLastCustomCity(business.city)
      } else {
        setShowCityInput(false)
      }
    }
  }, [business.city, availableCities])

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={14} />
  }

  const handleNext = async () => {
    const success = await handleSave()
    if (success) {
      onNext()
    }
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">
          Full Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${hasError('full_name') ? 'is-invalid' : ''}`}
          placeholder="Enter full name"
          value={personal.fullName}
          onChange={(e) => setPersonal((prev) => ({ ...prev, fullName: e.target.value }))}
        />
        {hasError('full_name') && <div className="invalid-feedback">{getFieldError('full_name')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">
          Business Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${hasError('business_name') ? 'is-invalid' : ''}`}
          placeholder="Enter business name"
          value={personal.businessName}
          onChange={(e) => setPersonal((prev) => ({ ...prev, businessName: e.target.value }))}
        />
        {hasError('business_name') && <div className="invalid-feedback">{getFieldError('business_name')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">
          Email <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          className={`form-control ${hasError('business_email') ? 'is-invalid' : ''}`}
          placeholder="Enter email id"
          value={personal.email}
          onChange={(e) => setPersonal((prev) => ({ ...prev, email: e.target.value }))}
        />
        {hasError('business_email') && <div className="invalid-feedback">{getFieldError('business_email')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">
          Mobile Phone <span className="text-danger">*</span>
        </label>
        <div className="input-group">
          <span className="input-group-text bg-light border" style={{ width: '120px' }}>
            {personal.phoneCountry}
          </span>
          <input
            type="tel"
            className={`form-control ${hasError('business_phone_no') ? 'is-invalid' : ''}`}
            placeholder="Enter number"
            value={personal.phoneNumber}
            onChange={(e) => setPersonal((prev) => ({ ...prev, phoneNumber: formatPhoneNumber(e.target.value) }))}
          />
          {hasError('business_phone_no') && <div className="invalid-feedback">{getFieldError('business_phone_no')}</div>}
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Business Street Address <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${hasError('business_address') ? 'is-invalid' : ''}`}
          placeholder="Enter business street address"
          value={business.businessAddress}
          onChange={(e) => setBusiness((prev) => ({ ...prev, businessAddress: e.target.value }))}
        />
        {hasError('business_address') && <div className="invalid-feedback">{getFieldError('business_address')}</div>}
      </div>

      <div className={showCityInput ? 'col-md-3' : 'col-md-6'}>
        <label className="form-label">
          City <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={showCityInput ? 'Others' : business.city}
          onChange={(value) => {
            if (value === 'Others') {
              setShowCityInput(true)
              setBusiness((prev) => ({ ...prev, city: lastCustomCity }))
            } else {
              setShowCityInput(false)
              setBusiness((prev) => ({ ...prev, city: value }))
            }
          }}
          options={availableCities}
          optionLabel="name"
          optionValue="code"
          placeholder="Select city"
          searchable={true}
          className={`w-100 ${hasError('business_city') ? 'is-invalid' : ''}`}
          disabled={!business.state}
        />
        {hasError('business_city') && <div className="invalid-feedback d-block">{getFieldError('business_city')}</div>}
      </div>

      {showCityInput && (
        <div className="col-md-3">
          <label className="form-label">
            City Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${hasError('business_city') ? 'is-invalid' : ''}`}
            placeholder="Enter city name"
            value={business.city}
            onChange={(e) => {
              const val = e.target.value
              setLastCustomCity(val)
              setBusiness((prev) => ({ ...prev, city: val }))
            }}
            required
          />
          {hasError('business_city') && <div className="invalid-feedback">{getFieldError('business_city')}</div>}
        </div>
      )}

      <div className="col-md-6">
        <label className="form-label">
          State of Incorporation <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={business.state}
          onChange={(value) => {
            const selectedStateObj = availableStates.find((s) => s.code === value || s.name === value)
            let defaultCity = ''
            if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
              defaultCity = selectedStateObj.cities[0]
            }
            setBusiness((prev) => ({
              ...prev,
              state: value,
              incorporationState: value,
              city: defaultCity,
            }))
          }}
          options={availableStates}
          optionLabel="name"
          optionValue="name"
          searchable={true}
          placeholder="Select state"
          className={`w-100 ${hasError('business_state') ? 'is-invalid' : ''}`}
        />
        {hasError('business_state') && <div className="invalid-feedback d-block">{getFieldError('business_state')}</div>}
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Zip Code <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${hasError('business_postal_code') ? 'is-invalid' : ''}`}
          placeholder="Enter zip code"
          value={business.zip}
          onChange={(e) => setBusiness((prev) => ({ ...prev, zip: e.target.value }))}
        />
        {hasError('business_postal_code') && (
          <div className="invalid-feedback">{getFieldError('business_postal_code')}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Industry Type <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={business.industryType}
          onChange={(value) => setBusiness((prev) => ({ ...prev, industryType: value }))}
          options={industryTypes}
          optionLabel="label"
          optionValue="value"
          searchable={true}
          placeholder="Select industry type"
          className={`w-100 ${hasError('industry_type') ? 'is-invalid' : ''}`}
        />
        {hasError('industry_type') && <div className="invalid-feedback d-block">{getFieldError('industry_type')}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">
          Entity Type <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={business.entityType}
          onChange={(value) => setBusiness((prev) => ({ ...prev, entityType: value }))}
          options={entityTypes}
          optionLabel="label"
          optionValue="value"
          placeholder="Select entity type"
          className={`w-100 ${hasError('entity_type') ? 'is-invalid' : ''}`}
        />
        {hasError('entity_type') && <div className="invalid-feedback d-block">{getFieldError('entity_type')}</div>}
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Time in Business <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control bg-light"
          value={business.yearsInBusiness || 'N/A'}
          disabled
        />
        <small className="text-muted d-block mt-1">
          Calculated from your Business Start Date
        </small>
      </div>
      <div className="col-md-6">
        <label className="form-label">Number of Employees</label>
        <input
          type="text"
          className={`form-control ${hasError('number_of_employees') ? 'is-invalid' : ''}`}
          placeholder="Enter number of employees"
          value={business.employees}
          onChange={(e) => setBusiness((prev) => ({ ...prev, employees: formatNumber(e.target.value) }))}
        />
        {hasError('number_of_employees') && (
          <div className="invalid-feedback">{getFieldError('number_of_employees')}</div>
        )}
      </div>

      <StepNavigation onNext={handleNext} isNextDisabled={!canProceed || isSaving} loading={loading || isApiLoading || isSaving} />
    </form>
  )
}
