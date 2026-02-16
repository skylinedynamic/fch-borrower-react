import React from 'react'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { SaveBusinessDetailsRequest, ValidationErrors } from '../../../modules/profile/types'
import { countries as countriesData } from '../../../data/countries'
import { entityTypes, industryTypes } from '../../../data/profile'
import { useBusinessDetails, useSaveBusinessDetails } from '../../../modules/profile/queries'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import TabLoader from '../../../components/Loader/TabLoader'
import { formatPhoneNumber, formatDUNS, formatEIN } from '../../../utils/formatters'

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
  const [availableCities, setAvailableCities] = useState<{ name: string, code: string }[]>([])
  const [availableStates, setAvailableStates] = useState<{ name: string, code: string, cities?: string[] }[]>([])
  const [showCityInput, setShowCityInput] = useState(false)

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
        business_email: apiData.business_email,
        duns_number: apiData.duns_number,
        business_address: apiData.business_address,
        business_city: apiData.business_city,
        business_state: apiData.business_state,
        business_country: apiData.country,
        business_country_code: apiData.country_code,
        business_zip_code: apiData.business_postal_code,
        business_website: apiData.business_website,
        business_entity_type: apiData.business_entity_type,
        business_industry_type: apiData.business_industry_type,
      })
    }
  }, [isSuccess, apiData])

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
            placeholder="9 digit EIN"
            value={data.business_ein}
            onChange={(e) => onChange({ ...data, business_ein: formatEIN(e.target.value) })}
            className={`form-control ${errors.business_ein ? 'is-invalid' : ''}`}
            maxLength={9}
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
          <label className="form-label">Business Email <span className="text-danger">*</span></label>
          <input
            type="email"
            placeholder="Enter business email"
            value={data.business_email}
            onChange={(e) => onChange({ ...data, business_email: e.target.value })}
            className={`form-control ${errors.business_email ? 'is-invalid' : ''}`}
          />
          {errors.business_email && <div className="invalid-feedback">{errors.business_email}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">DUNS Number</label>
          <input
            type="text"
            placeholder="9 digit DUNS Number"
            value={data.duns_number}
            onChange={(e) => onChange({ ...data, duns_number: formatDUNS(e.target.value) })}
            className={`form-control ${errors.duns_number ? 'is-invalid' : ''}`}
            maxLength={9}
          />
          {errors.duns_number && <div className="invalid-feedback">{errors.duns_number}</div>}
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
          <label className="form-label">Country <span className="text-danger">*</span></label>
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
            searchable={false}
            className={`w-100 ${errors.business_country ? 'is-invalid' : ''}`}
          />
          {errors.business_country && (
            <div className="invalid-feedback d-block">{errors.business_country}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">State <span className="text-danger">*</span></label>
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
            className={`w-100 ${errors.business_state ? 'is-invalid' : ''}`}
            disabled={!data.business_country}
          />
          {errors.business_state && <div className="invalid-feedback d-block">{errors.business_state}</div>}
        </div>

        <div className={showCityInput ? "col-md-3" : "col-md-6"}>
          <label className="form-label">City <span className="text-danger">*</span></label>
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
            className={`w-100 ${errors.business_city ? 'is-invalid' : ''}`}
            disabled={!data.business_state}
          />
          {errors.business_city && !showCityInput && (
            <div className="invalid-feedback d-block">{errors.business_city}</div>
          )}
        </div>

        {showCityInput && (
          <div className="col-md-3">
            <label className="form-label">City Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${errors.business_city ? 'is-invalid' : ''}`}
              placeholder="Enter city name"
              value={data.business_city}
              onChange={(e) => onChange({ ...data, business_city: e.target.value })}
              required
            />
            {errors.business_city && (
              <div className="invalid-feedback">{errors.business_city}</div>
            )}
          </div>
        )}


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
