import React from 'react'
import type { OwnerInfo, CoBorrower } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'
import CoBorrowerTable from '../shared/CoBorrowerTable'

type OwnershipInformationStepProps = {
  owner: OwnerInfo
  setOwner: (data: OwnerInfo) => void
  coBorrowers: CoBorrower[]
  onShowCoModal: () => void
  onDeleteCoBorrower: (idx: number) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export default function OwnershipInformationStep({
  owner,
  setOwner,
  coBorrowers,
  onShowCoModal,
  onDeleteCoBorrower,
  onNext,
  onBack,
  loading,
}: OwnershipInformationStepProps) {
  const isValid = !!(
    owner.firstName &&
    owner.lastName &&
    owner.dob &&
    owner.ssn &&
    owner.citizenship &&
    owner.streetAddress &&
    owner.city &&
    owner.state &&
    owner.zip &&
    owner.ownershipPct
  )

  if (loading) {
    return <FormSkeleton fieldCount={10} />
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">First Name <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter first name" value={owner.firstName} onChange={(e)=>setOwner({...owner,firstName:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Last Name <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter last name" value={owner.lastName} onChange={(e)=>setOwner({...owner,lastName:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
        <input type="date" className="form-control" value={owner.dob} onChange={(e)=>setOwner({...owner,dob:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Social Security Number (SSN) <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter social security number (SSN)" value={owner.ssn} onChange={(e)=>setOwner({...owner,ssn:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">Citizenship Status <span className="text-danger">*</span></label>
        <select className="form-select" value={owner.citizenship} onChange={(e)=>setOwner({...owner,citizenship:e.target.value})}>
          <option value="">Select citizenship status</option>
          <option value="US Citizen">US Citizen</option>
          <option value="Permanent Resident">Permanent Resident</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Street Address <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter street address" value={owner.streetAddress} onChange={(e)=>setOwner({...owner,streetAddress:e.target.value})} />
      </div>

      <div className="col-md-6">
        <label className="form-label">City <span className="text-danger">*</span></label>
        <select className="form-select" value={owner.city} onChange={(e)=>setOwner({...owner,city:e.target.value})}>
          <option value="">Select city</option>
          <option value="New York">New York</option>
          <option value="Los Angeles">Los Angeles</option>
          <option value="Chicago">Chicago</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">State <span className="text-danger">*</span></label>
        <select className="form-select" value={owner.state} onChange={(e)=>setOwner({...owner,state:e.target.value})}>
          <option value="">Select state</option>
          <option value="CA">California</option>
          <option value="NY">New York</option>
          <option value="IL">Illinois</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label">Zip Code <span className="text-danger">*</span></label>
        <input type="text" className="form-control" placeholder="Enter zip code" value={owner.zip} onChange={(e)=>setOwner({...owner,zip:e.target.value})} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Ownership % <span className="text-danger">*</span></label>
        <input type="number" className="form-control" placeholder="Enter ownership %" value={owner.ownershipPct} onChange={(e)=>setOwner({...owner,ownershipPct:e.target.value})} />
      </div>

      <div className="col-12 d-flex align-items-center">
        <div className="form-check">
          <input id="hasCoBorrower" className="form-check-input" type="checkbox" checked={owner.hasCoBorrower} onChange={(e)=>{ setOwner({...owner,hasCoBorrower:e.target.checked}); if(e.target.checked) onShowCoModal() }} />
          <label htmlFor="hasCoBorrower" className="form-check-label">Has Co-Borrower?</label>
        </div>
      </div>

      {(owner.hasCoBorrower || coBorrowers.length > 0) && (
        <div className="col-12 mt-2">
          <CoBorrowerTable coBorrowers={coBorrowers} onDelete={onDeleteCoBorrower} onAdd={onShowCoModal} />
        </div>
      )}

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!isValid} loading={loading} />
    </form>
  )
}
