import React from 'react'
import type { PersonalInfo, BusinessDetails } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CustomDropdown from '../shared/CustomDropdown'
import { entityTypes, industryTypes, yearsInBusinessOptions } from '../../../../data/profile'
import { countries as countriesData } from '../../../../data/countries'
import { useState, useMemo, useEffect } from 'react'
import { useBusinessInfo } from '../../../../modules/funding-application/queries'
import { formatPhoneNumber } from '../../../../utils/formatters'

type BusinessInformationStepProps = {
  personal: PersonalInfo
  setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>
  business: BusinessDetails
  setBusiness: React.Dispatch<React.SetStateAction<BusinessDetails>>
  canProceed: boolean
  onNext: () => void
  loading: boolean
}

export default function BusinessInformationStep({
  personal,
  setPersonal,
  business,
  setBusiness,
  canProceed,
  onNext,
  loading,
}: BusinessInformationStepProps) {
  const [availableStates, setAvailableStates] = useState<{ name: string; code: string; cities?: string[] }[]>([])
  const [availableCities, setAvailableCities] = useState<{ name: string; code: string }[]>([])
  const [showCityInput, setShowCityInput] = useState(false)
  const [lastCustomCity, setLastCustomCity] = useState('')

  const { data: apiData, isLoading: isApiLoading, isSuccess } = useBusinessInfo()

  // Pre-fill form from API
  useEffect(() => {
    if (isSuccess && apiData) {
      setPersonal((prev) => ({
        ...prev,
        fullName: apiData.full_name || prev.fullName,
        businessName: apiData.business_name || prev.businessName,
        email: apiData.business_email || prev.email,
        phoneNumber: apiData.business_phone_no || prev.phoneNumber,
        phoneCountry: (apiData.country_code === 'USA' || apiData.country === 'United States') ? 'USA (+1)' : 'CAN (+1)',
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

  // Update available states when country changes
  useEffect(() => {
    // Determine country from personal.phoneCountry or pre-filled data
    const countryName = personal.phoneCountry.includes('USA') ? 'United States' : 'Canada'
    const selectedCountry = countriesData.find((c) => c.name === countryName)
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

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Full Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter full name"
          value={personal.fullName}
          onChange={(e) => setPersonal((prev) => ({ ...prev, fullName: e.target.value }))}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Business Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter business name"
          value={personal.businessName}
          onChange={(e) => setPersonal((prev) => ({ ...prev, businessName: e.target.value }))}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Email <span className="text-danger">*</span></label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email id"
          value={personal.email}
          onChange={(e) => setPersonal((prev) => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Mobile Phone <span className="text-danger">*</span></label>
        <div className="input-group">
          <span className="input-group-text bg-light border" style={{ width: '120px' }}>
            {personal.phoneCountry}
          </span>
          <input
            type="tel"
            className="form-control"
            placeholder="Enter number"
            value={personal.phoneNumber}
            onChange={(e) => setPersonal((prev) => ({ ...prev, phoneNumber: formatPhoneNumber(e.target.value) }))}
          />
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label">Business Street Address <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter business street address"
          value={business.businessAddress}
          onChange={(e) => setBusiness((prev) => ({ ...prev, businessAddress: e.target.value }))}
        />
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
          className="w-100"
          disabled={!business.state}
        />
      </div>

      {showCityInput && (
        <div className="col-md-3">
          <label className="form-label">
            City Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter city name"
            value={business.city}
            onChange={(e) => {
              const val = e.target.value
              setLastCustomCity(val)
              setBusiness((prev) => ({ ...prev, city: val }))
            }}
            required
          />
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
              city: defaultCity 
            }))
          }}
          options={availableStates}
          optionLabel="name"
          optionValue="name" // Switched to name to match BusinessDetails.tsx and pre-filled data
          searchable={true}
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
          value={business.zip}
          onChange={(e) => setBusiness((prev) => ({ ...prev, zip: e.target.value }))}
        />
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
          className="w-100"
        />
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
          className="w-100"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">
          Time in Business <span className="text-danger">*</span>
        </label>
        <CustomDropdown
          value={business.yearsInBusiness}
          onChange={(value) => setBusiness((prev) => ({ ...prev, yearsInBusiness: value }))}
          options={yearsInBusinessOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select time in business"
          className="w-100"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Number of Employees</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter number of employees"
          value={business.employees}
          onChange={(e) => setBusiness((prev) => ({ ...prev, employees: e.target.value }))}
        />
      </div>

      <StepNavigation
        onNext={onNext}
        isNextDisabled={!canProceed}
        loading={loading || isApiLoading}
      />
    </form>
  )
}
