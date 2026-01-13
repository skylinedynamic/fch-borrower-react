import React from 'react'
import type { OwnerInfo, CoBorrower } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'
import CoBorrowerTable from '../shared/CoBorrowerTable'
import CoBorrowerModal from '../shared/CoBorrowerModal'
import CustomDropdown from '../shared/CustomDropdown'
import { countries } from '../../../../data/countries'

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

  // Hardcode USA for now as per PersonalInfo pattern or just use countries[0]
  React.useEffect(() => {
    const usa = countries.find((c) => c.code === 'USA')
    if (usa && usa.states) {
      setAvailableStates(usa.states.map((s) => ({ name: s.name, code: s.code, cities: s.cities })))
    }
  }, [])

  React.useEffect(() => {
    if (owner.state) {
      const selectedState = availableStates.find((s) => s.name === owner.state || s.code === owner.state)
      if (selectedState && selectedState.cities) {
        setAvailableCities(selectedState.cities.map((city) => ({ name: city, code: city })))
      }
    }
  }, [owner.state, availableStates])

  if (loading) {
    return <FormSkeleton fieldCount={10} />
  }

  return (
    <>
      <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">First Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter first name"
          value={owner.firstName}
          onChange={(e) => setOwner({ ...owner, firstName: e.target.value })}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Last Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter last name"
          value={owner.lastName}
          onChange={(e) => setOwner({ ...owner, lastName: e.target.value })}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
        <input
          type="date"
          className="form-control"
          value={owner.dob}
          onChange={(e) => setOwner({ ...owner, dob: e.target.value })}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Social Security Number (SSN) <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter social security number (SSN)"
          value={owner.ssn}
          onChange={(e) => setOwner({ ...owner, ssn: e.target.value })}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Citizenship Status <span className="text-danger">*</span></label>
        <select
          className="form-select"
          value={owner.citizenship}
          onChange={(e) => setOwner({ ...owner, citizenship: e.target.value })}
        >
          <option value="">Select citizenship status</option>
          <option value="US Citizen">US Citizen</option>
          <option value="Permanent Resident">Permanent Resident</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Street Address <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter street address"
          value={owner.streetAddress}
          onChange={(e) => setOwner({ ...owner, streetAddress: e.target.value })}
        />
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
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">City <span className="text-danger">*</span></label>
        <CustomDropdown
          value={owner.city}
          onChange={(value) => setOwner({ ...owner, city: value })}
          options={availableCities}
          optionLabel="name"
          optionValue="code"
          placeholder="Select city"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Zip Code <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter zip code"
          value={owner.zip}
          onChange={(e) => setOwner({ ...owner, zip: e.target.value })}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Ownership % <span className="text-danger">*</span></label>
        <input
          type="number"
          className="form-control"
          placeholder="Enter ownership %"
          value={owner.ownershipPct}
          onChange={(e) => setOwner({ ...owner, ownershipPct: e.target.value })}
        />
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
        onNext={onNext}
        isNextDisabled={!isValid}
        loading={loading}
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
