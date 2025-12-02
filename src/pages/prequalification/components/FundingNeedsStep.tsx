import React from 'react'
import type { FinancialSupport } from '../../../modules/pre-qualification'
import { formatCurrency } from '../../../utils/formatters'

interface FundingNeedsStepProps {
  support: FinancialSupport
  setSupport: (data: FinancialSupport) => void
  onNext: () => void
  onPrevious: () => void
}

export default function FundingNeedsStep({ support, setSupport, onNext, onPrevious }: FundingNeedsStepProps) {
  const handleFundingAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setSupport({ ...support, fundingAmount: formatted })
  }

  const handleDebtBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setSupport({ ...support, debtBalance: formatted })
  }

  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Funding Requested Amount <span className="text-danger">*</span></label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="50,000" 
          value={support.fundingAmount} 
          onChange={handleFundingAmountChange} 
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Funding Urgency <span className="text-danger">*</span></label>
        <select 
          className="form-select" 
          value={support.fundingUrgency} 
          onChange={(e) => setSupport({ ...support, fundingUrgency: e.target.value })}
        >
          <option value="">Select urgency</option>
          <option value="Immediate">Immediate</option>
          <option value="30_days">Within 30 days</option>
          <option value="1_3_months">1-3 months</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Purpose of Funding <span className="text-danger">*</span></label>
        <select 
          className="form-select" 
          value={support.fundingPurpose} 
          onChange={(e) => setSupport({ ...support, fundingPurpose: e.target.value })}
        >
          <option value="">Select purpose</option>
          <option value="Working Capital">Working Capital</option>
          <option value="Equipment">Equipment</option>
          <option value="Inventory">Inventory</option>
          <option value="Marketing">Marketing</option>
          <option value="Expansion">Expansion</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Personal Credit Score <span className="text-danger">*</span></label>
        <select 
          className="form-select" 
          value={support.personalCreditScore} 
          onChange={(e) => setSupport({ ...support, personalCreditScore: e.target.value })}
        >
          <option value="">Select personal credit score</option>
          <option value="Poor">Poor (&lt;580)</option>
          <option value="Fair">Fair (580-669)</option>
          <option value="Good">Good (670-739)</option>
          <option value="Very Good">Very Good (740-799)</option>
          <option value="Excellent">Excellent (800+)</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Estimate Business Credit Score</label>
        <select 
          className="form-select" 
          value={support.businessCreditScore} 
          onChange={(e) => setSupport({ ...support, businessCreditScore: e.target.value })}
        >
          <option value="">Select business credit score</option>
          <option value="None">No Business Credit</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Note</label>
        <textarea 
          className="form-control" 
          placeholder="Additional information or special requirements" 
          rows={1} 
          value={support.note} 
          onChange={(e) => setSupport({ ...support, note: e.target.value })} 
        />
      </div>
      <div className="col-6 d-flex align-items-center gap-3">
        <span className="fw-medium">Existing Business Debt?</span>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="existingDebt" 
            id="debtYes" 
            value="yes" 
            checked={support.existingDebt === 'yes'} 
            onChange={(e) => setSupport({ ...support, existingDebt: e.target.value })} 
          />
          <label className="form-check-label" htmlFor="debtYes">Yes</label>
        </div>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="existingDebt" 
            id="debtNo" 
            value="no" 
            checked={support.existingDebt === 'no'} 
            onChange={(e) => setSupport({ ...support, existingDebt: e.target.value })} 
          />
          <label className="form-check-label" htmlFor="debtNo">No</label>
        </div>
      </div>
      {support.existingDebt === 'yes' && (
        <div className="col-md-6">
          <label className="form-label">Debt Balance <span className="text-danger">*</span></label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="10,000" 
            value={support.debtBalance} 
            onChange={handleDebtBalanceChange} 
          />
        </div>
      )}
      <div className="col-12">
        <div className="form-check">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id="contactConsent" 
            checked={support.consent} 
            onChange={(e) => setSupport({ ...support, consent: e.target.checked })} 
          />
          <label className="form-check-label" htmlFor="contactConsent">I agree to be contacted by Four Corner Holdings, LLC</label>
        </div>
      </div>
      <div className="col-12 d-flex justify-content-between mt-4">
        <button type="button" className="btn btn-warning" onClick={onPrevious}>Previous</button>
        <button type="button" className="btn next-btn" onClick={onNext}>Next Step</button>
      </div>
    </form>
  )
}
