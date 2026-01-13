import type { CoBorrower } from '../../types'
import CustomDropdown from '../shared/CustomDropdown'
import { countries } from '../../../../data/countries'

type CoBorrowerModalProps = {
  coDraft: CoBorrower
  setCoDraft: (data: CoBorrower) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function CoBorrowerModal({ coDraft, setCoDraft, onSubmit }: CoBorrowerModalProps) {
  return (
    <div className="modal fade" id="coBorrowerModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Co-Borrower</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Your First Name"
                    value={coDraft.firstName}
                    onChange={(e) => setCoDraft({ ...coDraft, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Your Last Name"
                    value={coDraft.lastName}
                    onChange={(e) => setCoDraft({ ...coDraft, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Title/Role <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={coDraft.role}
                    onChange={(e) => setCoDraft({ ...coDraft, role: e.target.value })}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Owner">Owner</option>
                    <option value="Partner">Partner</option>
                    <option value="Guarantor">Guarantor</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Ownership % <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter Ownership %"
                    value={coDraft.ownershipPct}
                    onChange={(e) => setCoDraft({ ...coDraft, ownershipPct: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your Email"
                    value={coDraft.email}
                    onChange={(e) => setCoDraft({ ...coDraft, email: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Mobile Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter Mobile Number"
                    value={coDraft.mobilePhone}
                    onChange={(e) => setCoDraft({ ...coDraft, mobilePhone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Home Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter Home Phone Number"
                    value={coDraft.homePhone}
                    onChange={(e) => setCoDraft({ ...coDraft, homePhone: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Date of Birth <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={coDraft.dob}
                    onChange={(e) => setCoDraft({ ...coDraft, dob: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Social Security Number (SSN) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Social Security Number (SSN)"
                    value={coDraft.ssn}
                    onChange={(e) => setCoDraft({ ...coDraft, ssn: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Street Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Home Street Address"
                    value={coDraft.streetAddress}
                    onChange={(e) => setCoDraft({ ...coDraft, streetAddress: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter City Name"
                    value={coDraft.city}
                    onChange={(e) => setCoDraft({ ...coDraft, city: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    State <span className="text-danger">*</span>
                  </label>
                  <CustomDropdown
                    value={coDraft.state}
                    onChange={(value) => setCoDraft({ ...coDraft, state: value })}
                    options={countries.find(c => c.code === 'USA')?.states || []}
                    optionLabel="name"
                    optionValue="code"
                    placeholder="Select State"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Zip Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Zip Code"
                    value={coDraft.zip}
                    onChange={(e) => setCoDraft({ ...coDraft, zip: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Driver's License Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Driver's License Number"
                    value={coDraft.driversLicenseNumber}
                    onChange={(e) => setCoDraft({ ...coDraft, driversLicenseNumber: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Driver's License State</label>
                  <CustomDropdown
                    value={coDraft.driversLicenseState}
                    onChange={(value) => setCoDraft({ ...coDraft, driversLicenseState: value })}
                    options={countries.find(c => c.code === 'USA')?.states || []}
                    optionLabel="name"
                    optionValue="code"
                    placeholder="Select State"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary">
                + Add Co-Borrower
              </button>
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
