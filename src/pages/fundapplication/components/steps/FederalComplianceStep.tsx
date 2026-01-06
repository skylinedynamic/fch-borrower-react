import React from 'react'
import type { FederalCompliance } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import FormSkeleton from '../shared/FormSkeleton'

type FederalComplianceStepProps = {
  federal: FederalCompliance
  setFederal: (data: FederalCompliance) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}

const questions: { key: keyof FederalCompliance; label: string }[] = [
  { key: 'bankruptcy', label: 'Have you or any owner ever declared bankruptcy?' },
  { key: 'lawsuit', label: 'Are you or any owner currently involved in a lawsuit?' },
  { key: 'federalLoanDefault', label: 'Have you or any owner ever defaulted on a federal loan (student, SBA, FHA, etc.)?' },
  { key: 'federalDebtDelinquent', label: 'Are you or any owner currently delinquent on any federal debt?' },
  { key: 'criminalOffense', label: 'Have you or any owner been arrested or convicted for any criminal offense other than a minor vehicle violation?' },
  { key: 'paroleProbation', label: 'Are you or any owner on parole or probation?' },
  { key: 'suspendedDebarred', label: 'Is the business or any owner currently suspended, debarred, or otherwise excluded from participation in federal programs?' },
  { key: 'judgmentsLiensBusiness', label: 'Is the business presently subject to any judgments or tax liens?' },
  { key: 'judgmentsLiensOwner', label: 'Is any owner presently subject to any judgments or tax liens?' },
]

export default function FederalComplianceStep({
  federal,
  setFederal,
  onNext,
  onBack,
  loading,
}: FederalComplianceStepProps) {
  const anyYes = questions.some((q) => federal[q.key] === 'yes')
  const allAnswered = questions.every((q) => federal[q.key] === 'yes' || federal[q.key] === 'no')
  const stepValid = allAnswered && (!anyYes || federal.explanation.trim().length > 0)

  if (loading) {
    return <FormSkeleton fieldCount={9} />
  }

  return (
    <form className="row g-3">
      <div className="col-12">
        <div className="list-group">
          {questions.map((q) => (
            <div className="list-group-item" key={q.key as string}>
              <div className="row align-items-center">
                <div className="col-9 text-start">
                  <span className="fw-medium d-block">
                    {q.label} <span className="text-danger">*</span>
                  </span>
                </div>
                <div className="col-3 text-end">
                  <div className="btn-group" role="group" aria-label={`Select answer for ${q.label}`}>
                    <input
                      type="radio"
                      className="btn-check"
                      name={q.key as string}
                      id={`${q.key}-yes`}
                      checked={federal[q.key] === 'yes'}
                      onChange={() => setFederal({ ...federal, [q.key]: 'yes' })}
                    />
                    <label className="btn btn-sm btn-outline-success" htmlFor={`${q.key}-yes`}>
                      Yes
                    </label>
                    <input
                      type="radio"
                      className="btn-check"
                      name={q.key as string}
                      id={`${q.key}-no`}
                      checked={federal[q.key] === 'no'}
                      onChange={() => setFederal({ ...federal, [q.key]: 'no' })}
                    />
                    <label className="btn btn-sm btn-outline-danger" htmlFor={`${q.key}-no`}>
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-header text-start">
            Explanation <span className="text-danger">{anyYes ? '*' : ''}</span>
          </div>
          <div className="card-body">
            <textarea
              className="form-control"
              rows={4}
              placeholder="If yes to any of the above, explain"
              value={federal.explanation}
              onChange={(e) => setFederal({ ...federal, explanation: e.target.value })}
            />
            {anyYes && !federal.explanation.trim() && (
              <div className="form-text text-danger mt-1">Explanation is required when any answer is Yes.</div>
            )}
          </div>
        </div>
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} isNextDisabled={!stepValid} loading={loading} />
    </form>
  )
}
