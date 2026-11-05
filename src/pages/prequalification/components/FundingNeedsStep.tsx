import React from 'react'
import type { FinancialSupport } from '../../../modules/pre-qualification'
import { formatCurrency } from '../../../utils/formatters'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { fundingUrgencyOptions, purposeOfFundingOptions, personalCreditScoreOptions, estimatedBusinessCreditScoreOptions, FUNDING_PURPOSE_OTHER, PURPOSE_NOTE_MAX, NOTES_MAX } from '../../../data/profile'

interface FundingNeedsStepProps {
  support: FinancialSupport
  setSupport: (data: FinancialSupport) => void
  onNext: () => void
  onPrevious: () => void
  errors?: Record<string, string>
  isSubmitting?: boolean
}

export default function FundingNeedsStep({ support, setSupport, onNext, onPrevious, errors = {}, isSubmitting = false }: FundingNeedsStepProps) {
  const handleFundingAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setSupport({ ...support, fundingRequestedAmount: formatted })
  }

  const handleDebtBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setSupport({ ...support, debtBalance: formatted })
  }

  return (
    <form className="row g-3" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
      <div className="col-md-6">
        <label className="form-label">Funding Requested Amount <span className="text-danger">*</span></label>
        <input
          type="text"
          className={`form-control ${errors.fundingRequestedAmount ? 'is-invalid' : ''}`}
          placeholder="25,000"
          value={support.fundingRequestedAmount}
          onChange={handleFundingAmountChange}
          disabled={isSubmitting}
        />
        {errors.fundingRequestedAmount && <div className="invalid-feedback">{errors.fundingRequestedAmount}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Funding Urgency <span className="text-danger">*</span></label>
        <CustomDropdown
          value={support.fundingUrgency}
          onChange={(value) => setSupport({ ...support, fundingUrgency: value })}
          options={fundingUrgencyOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select urgency"
          className={`w-100 ${errors.fundingUrgency ? 'is-invalid' : ''}`}
        />
        {errors.fundingUrgency && <div className="invalid-feedback d-block">{errors.fundingUrgency}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Purpose of Funding <span className="text-danger">*</span></label>
        <CustomDropdown
          value={support.purposeOfFunding}
          onChange={(value) => setSupport({
            ...support,
            purposeOfFunding: value,
            purposeNote: value === FUNDING_PURPOSE_OTHER ? support.purposeNote : ''
          })}
          options={purposeOfFundingOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select purpose"
          className={`w-100 ${errors.purposeOfFunding ? 'is-invalid' : ''}`}
        />
        {errors.purposeOfFunding && <div className="invalid-feedback d-block">{errors.purposeOfFunding}</div>}
      </div>
      {support.purposeOfFunding === FUNDING_PURPOSE_OTHER && (
        <div className="col-md-6">
          <label className="form-label">Purpose Of Funding Note <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control ${errors.purposeNote ? 'is-invalid' : ''}`}
            placeholder="Please specify"
            value={support.purposeNote}
            onChange={(e) => setSupport({ ...support, purposeNote: e.target.value })}
            disabled={isSubmitting}
          />
          {errors.purposeNote && <div className="invalid-feedback">{errors.purposeNote}</div>}
          <div className={`form-text text-end ${support.purposeNote.length > PURPOSE_NOTE_MAX ? 'text-danger' : ''}`}>{support.purposeNote.length} / {PURPOSE_NOTE_MAX}</div>
        </div>
      )}
      <div className="col-md-6">
        <label className="form-label">Personal Credit Score <span className="text-danger">*</span></label>
        <CustomDropdown
          value={support.personalCreditScore}
          onChange={(value) => setSupport({ ...support, personalCreditScore: value })}
          options={personalCreditScoreOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select personal credit score"
          className={`w-100 ${errors.personalCreditScore ? 'is-invalid' : ''}`}
        />
        {errors.personalCreditScore && <div className="invalid-feedback d-block">{errors.personalCreditScore}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label">Estimate Business Credit Score <span className="text-danger">*</span></label>
        <CustomDropdown
          value={support.estimatedBusinessCreditScore}
          onChange={(value) => setSupport({ ...support, estimatedBusinessCreditScore: value })}
          options={estimatedBusinessCreditScoreOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Select business credit score"
          className={`w-100 ${errors.estimatedBusinessCreditScore ? 'is-invalid' : ''}`}
        />
        {errors.estimatedBusinessCreditScore && <div className="invalid-feedback d-block">{errors.estimatedBusinessCreditScore}</div>}
      </div>
      <div className="col-md-12">
        <label className="form-label">Note</label>
        <textarea
          className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
          placeholder="Additional information or special requirements"
          rows={2}
          value={support.notes}
          onChange={(e) => setSupport({ ...support, notes: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
        <div className={`form-text text-end ${(support.notes || '').length > NOTES_MAX ? 'text-danger' : ''}`}>{(support.notes || '').length} / {NOTES_MAX}</div>
      </div>
      <div className="col-12 d-flex align-items-center gap-3">
        <span className="fw-medium">Existing Business Debt?</span>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="existingDebt"
            id="debtYes"
            value="true"
            checked={support.existingBusinessDebt === true}
            onChange={() => setSupport({ ...support, existingBusinessDebt: true })}
            disabled={isSubmitting}
          />
          <label className="form-check-label" htmlFor="debtYes">Yes</label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="existingDebt"
            id="debtNo"
            value="false"
            checked={support.existingBusinessDebt === false}
            onChange={() => setSupport({ ...support, existingBusinessDebt: false })}
            disabled={isSubmitting}
          />
          <label className="form-check-label" htmlFor="debtNo">No</label>
        </div>
      </div>
      {support.existingBusinessDebt === true && (
        <div className="col-md-6">
          <label className="form-label">Debt Balance <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control ${errors.debtBalance ? 'is-invalid' : ''}`}
            placeholder="5,000"
            value={support.debtBalance}
            onChange={handleDebtBalanceChange}
            disabled={isSubmitting}
          />
          {errors.debtBalance && <div className="invalid-feedback">{errors.debtBalance}</div>}
        </div>
      )}

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
