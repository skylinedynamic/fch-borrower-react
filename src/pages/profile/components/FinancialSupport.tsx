import React from 'react'
import { FinancialSupport as FinancialSupportType } from '../types'

interface FinancialSupportProps {
  data: FinancialSupportType
  onChange: (data: FinancialSupportType) => void
  onSave: () => void
  onBack: () => void
  saving: boolean
}

export default function FinancialSupport({ data, onChange, onSave, onBack, saving }: FinancialSupportProps) {
  return (
    <div className="fade-panel">
      <form className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Currency <span className="text-danger">*</span></label>
          <select 
            className="form-select" 
            value={data.currency} 
            onChange={(e) => onChange({ ...data, currency: e.target.value })}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Years in Business <span className="text-danger">*</span></label>
          <select 
            className="form-select" 
            value={data.yearsInBusiness} 
            onChange={(e) => onChange({ ...data, yearsInBusiness: e.target.value })}
          >
            <option value="">Select years</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="$20,000" 
            value={data.monthlyRevenue} 
            onChange={(e) => onChange({ ...data, monthlyRevenue: e.target.value })} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Annual Revenue</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="$30,000" 
            value={data.annualRevenue} 
            onChange={(e) => onChange({ ...data, annualRevenue: e.target.value })} 
          />
        </div>
        <div className="col-12 d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-warning" onClick={onBack}>Previous</button>
          <button type="button" className="btn primary-btn" onClick={onSave}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  )
}
