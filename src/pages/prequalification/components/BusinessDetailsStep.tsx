import React from 'react'
import type { BusinessDetails, FinancialSupport } from '../../../modules/pre-qualification'
import CustomDropdown from '../../profile/components/CustomDropdown'
import { entityTypes, industryTypes, yearsInBusinessOptions } from '../../../data/profile'
import { formatCurrency } from '../../../utils/formatters'

interface BusinessDetailsStepProps {
  business: BusinessDetails
  support: FinancialSupport
  setBusiness: (data: BusinessDetails) => void
  setSupport: (data: FinancialSupport) => void
  onNext: () => void
  onPrevious: () => void
}

export default function BusinessDetailsStep({ business, support, setBusiness, setSupport, onNext, onPrevious }: BusinessDetailsStepProps) {
  const handleMonthlyRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setSupport({ ...support, monthlyRevenue: formatted })
  }

  const handleAnnualRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setSupport({ ...support, annualRevenue: formatted })
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Business Name <span className="text-danger">*</span></label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="ABC Corporation" 
          value={business.businessName} 
          onChange={(e) => setBusiness({ ...business, businessName: e.target.value })} 
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Industry Type <span className="text-danger">*</span></label>
        <CustomDropdown
          value={business.industryType}
          onChange={(value) => setBusiness({ ...business, industryType: value })}
          options={industryTypes}
          optionLabel="label"
          optionValue="value"
          placeholder="Select industry type"
          searchable={true}
          className="w-100"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Business Structure <span className="text-danger">*</span></label>
        <CustomDropdown
          value={business.entityType}
          onChange={(value) => setBusiness({ ...business, entityType: value })}
          options={entityTypes}
          optionLabel="label"
          optionValue="value"
          placeholder="Select business structure"
          className="w-100"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Time in Business <span className="text-danger">*</span></label>
        <CustomDropdown
          value={support.yearsInBusiness}
          onChange={(value) => setSupport({ ...support, yearsInBusiness: value })}
          options={yearsInBusinessOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select time in business"
          className="w-100"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="40,000"
          value={support.monthlyRevenue}
          onChange={handleMonthlyRevenueChange}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Annual Revenue <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          placeholder="60,000"
          value={support.annualRevenue}
          onChange={handleAnnualRevenueChange}
        />
      </div>
      <div className="col-12 d-flex justify-content-between mt-4">
        <button type="button" className="btn btn-warning" onClick={onPrevious}>Previous</button>
        <button type="button" className="btn next-btn" onClick={onNext}>Next Step</button>
      </div>
    </form>
  )
}
