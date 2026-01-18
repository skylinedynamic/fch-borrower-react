import React from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import type { OwnerInfo, CoBorrower } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../../../../components/Loader/FormSkeleton'
import CoBorrowerTable from '../shared/CoBorrowerTable'
import CoBorrowerModal from '../shared/CoBorrowerModal'
import CustomDropdown from '../shared/CustomDropdown'
import { countries } from '../../../../data/countries'
import { useOwnershipInfo, useSaveOwnershipInfo } from '../../../../modules/funding-application/queries'
import { citizenshipOptions } from '../../../../data/profile'
import { toast } from 'react-toastify'

type OwnershipInformationStepProps = {
  owner: OwnerInfo
  setOwner: React.Dispatch<React.SetStateAction<OwnerInfo>>
  coBorrowers: CoBorrower[]
  onShowCoModal: () => void
  onDeleteCoBorrower: (idx: number) => void
  coDraft: CoBorrower
  setCoDraft: (data: CoBorrower) => void
  onAddCoBorrower: (e: React.FormEvent) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
  isValid: boolean
}

export default function OwnershipInformationStep({
  owner,
  setOwner,
  coBorrowers,
  onShowCoModal,
  onDeleteCoBorrower,
  coDraft,
  setCoDraft,
  onAddCoBorrower,
  onNext,
  onBack,
  loading,
  isValid,
}: OwnershipInformationStepProps) {
  const [availableStates, setAvailableStates] = React.useState<{ name: string; code: string; cities?: string[] }[]>([])
  const [availableCities, setAvailableCities] = React.useState<{ name: string; code: string }[]>([])
  const [showCityInput, setShowCityInput] = React.useState(false)
  const [lastCustomCity, setLastCustomCity] = React.useState('')
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  const { data: apiData, isLoading: isApiLoading, isSuccess } = useOwnershipInfo()
  const { mutate: saveOwnershipInfo, isPending: isSaving } = useSaveOwnershipInfo()

  // Pre-fill form from API
  React.useEffect(() => {
    if (isSuccess && apiData) {
      setOwner((prev) => ({
        ...prev,
        id: apiData.id || null,
        firstName: apiData.first_name || prev.firstName,
        lastName: apiData.last_name || prev.lastName,
        dob: apiData.date_of_birth || prev.dob,
        ssn: apiData.ssn || prev.ssn,
        citizenship: apiData.citizenship_status || prev.citizenship || citizenshipOptions[0].value,
        streetAddress: apiData.street_address || prev.streetAddress,
        country: apiData.country || prev.country || 'United States',
        city: apiData.city || prev.city,
        state: apiData.state || prev.state,
        zip: apiData.zip_code || prev.zip,
        ownershipPct: apiData.ownership || prev.ownershipPct,
        hasCoBorrower: apiData.has_co_borrower ?? prev.hasCoBorrower,
      }))
    }
  }, [isSuccess, apiData, setOwner])

  // Helper to get field error
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  // Helper to check if field has error
  const hasError = (fieldName: string): boolean => {
    return !!validationErrors[fieldName]
  }

  // Update available states when country changes
  React.useEffect(() => {
    if (owner.country) {
      const selectedCountry = countries.find((c) => c.name === owner.country || c.code === owner.country)
      if (selectedCountry && selectedCountry.states) {
        setAvailableStates(selectedCountry.states.map((s) => ({ name: s.name, code: s.code, cities: s.cities })))
      } else {
        setAvailableStates([])
      }
    }
  }, [owner.country])

  React.useEffect(() => {
    if (owner.state) {
      const selectedState = availableStates.find((s) => s.name === owner.state || s.code === owner.state)
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
  }, [owner.state, availableStates])

  // Sync showCityInput with owner.city
  React.useEffect(() => {
    if (owner.city && availableCities.length > 0) {
      const exists = availableCities.find((c) => c.code === owner.city && c.code !== 'Others')
      if (!exists) {
        setShowCityInput(true)
        setLastCustomCity(owner.city)
      } else {
        setShowCityInput(false)
      }
    }
  }, [owner.city, availableCities])

  if (loading || isApiLoading) {
    return <FormSkeleton fieldCount={10} />
  }

  const handleNext = () => {
    // Clear previous errors
    setValidationErrors({})

    const payload = {
      id: owner.id,
      first_name: owner.firstName,
      last_name: owner.lastName,
      date_of_birth: owner.dob,
      ssn: owner.ssn,
      citizenship_status: owner.citizenship,
      street_address: owner.streetAddress,
      country: owner.country,
      city: owner.city,
      state: owner.state,
      zip_code: owner.zip,
      ownership: owner.ownershipPct,
      has_co_borrower: owner.hasCoBorrower,
    }

    saveOwnershipInfo(payload, {
      onSuccess: () => {
        onNext()
      },
      onError: (error: any) => {
        const errors = error.response?.data?.errors
        if (errors) {
          setValidationErrors(errors)
        } else {
          toast.error(error.response?.data?.message || 'Failed to save ownership information. Please try again.')
        }
      }
    })
  }

  return (
    <>
      <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">First Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${hasError('first_name') ? 'is-invalid' : ''}`}
          placeholder="Enter first name"
          value={owner.firstName}
          onChange={(e) => setOwner({ ...owner, firstName: e.target.value })}
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
          value={owner.lastName}
          onChange={(e) => setOwner({ ...owner, lastName: e.target.value })}
        />
        {hasError('last_name') && (
          <div className="invalid-feedback">{getFieldError('last_name')}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
        <Flatpickr
          className={`form-control ${hasError('date_of_birth') ? 'is-invalid' : ''}`}
          value={owner.dob}
          onChange={(dates, dateStr) => {
            setOwner({ ...owner, dob: dateStr })
          }}
          options={{
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "m-d-Y",
            maxDate: "today",
            // yearDropdown: true, // Removed due to type error, though supported by flatpickr instance usually
          }}
          placeholder="Select date of birth"
        />
        {hasError('date_of_birth') && (
          <div className="invalid-feedback d-block">{getFieldError('date_of_birth')}</div>
        )}
      </div>
      <div className="col-md-6">
        <label className="form-label">Social Security Number (SSN) <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${hasError('ssn') ? 'is-invalid' : ''}`}
          placeholder="Enter social security number (SSN)"
          value={owner.ssn}
          onChange={(e) => setOwner({ ...owner, ssn: e.target.value })}
        />
        {hasError('ssn') && (
          <div className="invalid-feedback">{getFieldError('ssn')}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label">Citizenship Status <span className="text-danger">*</span></label>
        <CustomDropdown
          value={owner.citizenship}
          onChange={(value) => setOwner({ ...owner, citizenship: value })}
          options={citizenshipOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select citizenship status"
          className={`w-100 ${hasError('citizenship_status') ? 'is-invalid' : ''}`}
        />
        {hasError('citizenship_status') && (
          <div className="invalid-feedback d-block">{getFieldError('citizenship_status')}</div>
        )}
      </div>
      <div className="col-md-6">
        <label className="form-label">Street Address <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${hasError('street_address') ? 'is-invalid' : ''}`}
          placeholder="Enter street address"
          value={owner.streetAddress}
          onChange={(e) => setOwner({ ...owner, streetAddress: e.target.value })}
        />
        {hasError('street_address') && (
          <div className="invalid-feedback">{getFieldError('street_address')}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label">State <span className="text-danger">*</span></label>
        <CustomDropdown
          value={owner.state}
          onChange={(value) => {
            const selectedStateObj = availableStates.find((s) => s.code === value || s.name === value)
            let defaultCity = ''
            if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
              defaultCity = selectedStateObj.cities[0]
            }
            setOwner({ ...owner, state: value, city: defaultCity })
          }}
          options={availableStates}
          optionLabel="name"
          optionValue="name"
          placeholder="Select state"
          className={`w-100 ${hasError('state') ? 'is-invalid' : ''}`}
        />
        {hasError('state') && (
          <div className="invalid-feedback d-block">{getFieldError('state')}</div>
        )}
      </div>

      <div className={showCityInput ? 'col-md-3' : 'col-md-6'}>
        <label className="form-label">City <span className="text-danger">*</span></label>
        <CustomDropdown
          value={showCityInput ? 'Others' : owner.city}
          onChange={(value) => {
            if (value === 'Others') {
              setShowCityInput(true)
              setOwner({ ...owner, city: lastCustomCity })
            } else {
              setShowCityInput(false)
              setOwner({ ...owner, city: value })
            }
          }}
          options={availableCities}
          optionLabel="name"
          optionValue="code"
          placeholder="Select city"
          searchable={true}
          className={`w-100 ${hasError('city') ? 'is-invalid' : ''}`}
        />
        {hasError('city') && (
          <div className="invalid-feedback d-block">{getFieldError('city')}</div>
        )}
      </div>

      {showCityInput && (
        <div className="col-md-3">
          <label className="form-label">
            City Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${hasError('city') ? 'is-invalid' : ''}`}
            placeholder="Enter city name"
            value={owner.city}
            onChange={(e) => {
              const val = e.target.value
              setLastCustomCity(val)
              setOwner({ ...owner, city: val })
            }}
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
          value={owner.zip}
          onChange={(e) => setOwner({ ...owner, zip: e.target.value })}
        />
        {hasError('zip_code') && (
          <div className="invalid-feedback">{getFieldError('zip_code')}</div>
        )}
      </div>
      <div className="col-md-6">
        <label className="form-label">Ownership % <span className="text-danger">*</span></label>
        <input
          type="number"
          className={`form-control ${hasError('ownership') ? 'is-invalid' : ''}`}
          placeholder="Enter ownership %"
          value={owner.ownershipPct}
          onChange={(e) => setOwner({ ...owner, ownershipPct: e.target.value })}
        />
        {hasError('ownership') && (
          <div className="invalid-feedback">{getFieldError('ownership')}</div>
        )}
      </div>

      <div className="col-12 d-flex align-items-center">
        <div className="form-check">
          <input
            id="hasCoBorrower"
            className="form-check-input"
            type="checkbox"
            checked={owner.hasCoBorrower}
            onChange={(e) => {
              const checked = e.target.checked
              setOwner((prev: OwnerInfo) => ({ ...prev, hasCoBorrower: checked }))
              if (checked) {
                setTimeout(onShowCoModal, 150)
              }
            }}
          />
          <label htmlFor="hasCoBorrower" className="form-check-label">Has Co-Borrower?</label>
        </div>
      </div>

      {(owner.hasCoBorrower || coBorrowers.length > 0) && (
        <div className="col-12 mt-2">
          <CoBorrowerTable
            coBorrowers={coBorrowers}
            onDelete={onDeleteCoBorrower}
            onAdd={onShowCoModal}
          />
        </div>
      )}

      <StepNavigation
        onBack={onBack}
        onNext={handleNext}
        isNextDisabled={!isValid || isSaving}
        loading={loading || isApiLoading || isSaving}
      />
    </form>
    
    <CoBorrowerModal
      coDraft={coDraft}
      setCoDraft={setCoDraft}
      onSubmit={onAddCoBorrower}
    />
  </>
)
}
