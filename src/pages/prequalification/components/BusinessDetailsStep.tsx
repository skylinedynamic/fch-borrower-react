import React from 'react'
import type { BusinessDetails, FinancialSupport } from '../../../modules/pre-qualification'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { entityTypes, industryTypes } from '../../../data/profile'
import { formatCurrency } from '../../../utils/formatters'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'
import { Link } from 'react-router-dom'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'

/** Profile > Business Details, where the business start date lives. */
const PROFILE_BUSINESS_TAB = '/profile?tab=1'

interface BusinessDetailsStepProps {
  business: BusinessDetails
  support: FinancialSupport
  setBusiness: (data: BusinessDetails) => void
  setSupport: (data: FinancialSupport) => void
  onNext: () => void
  onPrevious: () => void
  errors?: Record<string, string>
  isSubmitting?: boolean
  /** The profile has a business start date; without one this step asks for it (BUG-037). */
  startDateOnFile?: boolean
}

export default function BusinessDetailsStep({ business, support, setBusiness, setSupport, onNext, onPrevious, errors = {}, isSubmitting = false, startDateOnFile = true }: BusinessDetailsStepProps) {
  // "Time in Business is required" comes back on years_in_business when no date was picked.
  const startDateError = errors.businessStartDate || errors.yearsInBusiness
  const handleMonthlyRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setBusiness({ ...business, monthlyRevenue: formatted })
  }

  const handleAnnualRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setBusiness({ ...business, annualRevenue: formatted })
  }

  const dynamicIndustryTypes = React.useMemo(() => {
    const opts = [...industryTypes]
    if (business.industryType && !opts.some((o) => o.value.toLowerCase() === business.industryType.toLowerCase())) {
      opts.unshift({ label: business.industryType, value: business.industryType })
    }
    return opts
  }, [business.industryType])

  const dynamicEntityTypes = React.useMemo(() => {
    const opts = [...entityTypes]
    if (business.businessStructure && !opts.some((o) => o.value.toLowerCase() === business.businessStructure.toLowerCase())) {
      opts.unshift({ label: business.businessStructure, value: business.businessStructure })
    }
    return opts
  }, [business.businessStructure])

  return (
    <form className="row g-3" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
      <div className="col-md-6">
        <label className="form-label">Business Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${errors.businessName ? 'is-invalid' : ''}`}
          placeholder="ABC Corporation"
          value={business.businessName}
          onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.businessName && <div className="invalid-feedback">{errors.businessName}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Industry Type <span className="text-danger">*</span></label>
        <CustomDropdown
          value={business.industryType}
          onChange={(value) => setBusiness({ ...business, industryType: value })}
          options={dynamicIndustryTypes}
          optionLabel="label"
          optionValue="value"
          placeholder="Select industry type"
          searchable={true}
          className={`w-100 ${errors.industryType ? 'is-invalid' : ''}`}
        />
        {errors.industryType && <div className="invalid-feedback d-block">{errors.industryType}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Business Structure <span className="text-danger">*</span></label>
        <CustomDropdown
          value={business.businessStructure}
          onChange={(value) => setBusiness({ ...business, businessStructure: value })}
          options={dynamicEntityTypes}
          optionLabel="label"
          optionValue="value"
          placeholder="Select business structure"
          className={`w-100 ${errors.businessStructure ? 'is-invalid' : ''}`}
        />
        {errors.businessStructure && <div className="invalid-feedback d-block">{errors.businessStructure}</div>}
      </div>
      {startDateOnFile ? (
        <div className="col-md-6">
          <label className="form-label">Time in Business <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control bg-light"
            value={business.yearsInBusiness}
            disabled
          />
          <small className="text-muted d-block mt-1">
            Calculated from your Business Start Date. To change it, go to your <Link to={PROFILE_BUSINESS_TAB}>profile</Link>.
          </small>
          {errors.yearsInBusiness && <div className="invalid-feedback d-block">{errors.yearsInBusiness}</div>}
        </div>
      ) : (
        <div className="col-md-6">
          <label className="form-label">Business Start Date <span className="text-danger">*</span></label>
          <Flatpickr
            className={`form-control ${startDateError ? 'is-invalid' : ''}`}
            value={business.businessStartDate || ''}
            onChange={(_dates, dateStr) => setBusiness({ ...business, businessStartDate: dateStr })}
            options={{
              dateFormat: 'Y-m-d',
              altInput: true,
              altFormat: 'j M, Y',
              maxDate: 'today',
              monthSelectorType: 'dropdown',
              disableMobile: true,
              plugins: [yearDropdownPlugin(1900)],
            } as any}
            placeholder="Select business start date"
            disabled={isSubmitting}
          />
          <small className="text-muted d-block mt-1">
            Time in Business is worked out from it. It is also saved to your <Link to={PROFILE_BUSINESS_TAB}>profile</Link>.
          </small>
          {startDateError && <div className="invalid-feedback d-block">{startDateError}</div>}
        </div>
      )}
      <div className="col-md-6">
        <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${errors.monthlyRevenue ? 'is-invalid' : ''}`}
          placeholder="10,000"
          value={business.monthlyRevenue}
          onChange={handleMonthlyRevenueChange}
          disabled={isSubmitting}
        />
        {errors.monthlyRevenue && <div className="invalid-feedback">{errors.monthlyRevenue}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Annual Revenue <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${errors.annualRevenue ? 'is-invalid' : ''}`}
          placeholder="120,000"
          value={business.annualRevenue}
          onChange={handleAnnualRevenueChange}
          disabled={isSubmitting}
        />
        {errors.annualRevenue && <div className="invalid-feedback">{errors.annualRevenue}</div>}
      </div>
      <div className="col-12 d-flex justify-content-between mt-4">
        <button type="button" className="btn btn-warning" onClick={onPrevious} disabled={isSubmitting}>Previous</button>
        <button type="submit" className="btn next-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            'Next Step'
          )}
        </button>
      </div>
    </form>
  )
}
