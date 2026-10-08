import React from 'react'
import { Modal, ModalBody } from 'reactstrap'
import { ONBOARDING_PATHS, RESULTS_ESTIMATE_DISCLAIMER } from '../../config/onboardingSteps'
import type { OnboardingPathConfig, OnboardingPathId } from '../../config/onboardingSteps'
import { ENGINE_STATUS_VALUES } from '../../config/funding'
import { useCapitalAccessOverview, useCapitalAccessStrategies } from '../../modules/capital-access/queries'
import { useFundingOptions } from '../../modules/funding'

interface ResultsChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onChoose: (path: OnboardingPathId) => void
  /** The path chosen before, if the borrower is changing their mind. */
  selected?: OnboardingPathId | null
  /** A choice is being saved. */
  choosing?: boolean
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/** "$815,000" only when the estimate is a real, non-zero figure. */
const estimateOf = (value: string | undefined): string | null => {
  if (!value) return null
  const amount = Number(value.replace(/[^0-9.]/g, ''))
  return amount > 0 ? value : null
}

/**
 * "What are you looking for?": the choice a borrower makes once their Tier 0
 * and credit profile are verified. Each path leads to a page of its own.
 *
 * The figures are real or absent. The estimate heads the window only when
 * Capital Access has one, and a path shows a count only when its page has
 * something to count: eligible card strategies, likely-eligible funding
 * programs. A path with nothing to count says what it is instead.
 */
export default function ResultsChoiceModal({
  isOpen,
  onClose,
  onChoose,
  selected = null,
  choosing = false,
}: ResultsChoiceModalProps) {
  const { data: overview } = useCapitalAccessOverview({ enabled: isOpen })
  const { data: strategies } = useCapitalAccessStrategies({ enabled: isOpen })
  const { data: funding } = useFundingOptions({ enabled: isOpen })

  const estimate = estimateOf(overview?.estimated_total_access)

  const metaFor = (path: OnboardingPathConfig): string | null => {
    if (path.id === 'card_stacking' && strategies) {
      const eligible = strategies.filter((s) => s.approval_status && !s.isCompleted).length
      return eligible > 0 ? plural(eligible, 'eligible card strategy', 'eligible card strategies') : 'None eligible yet'
    }
    if (path.id === 'funding' && funding) {
      const likely = (funding.groups ?? [])
        .flatMap((group) => group.sequencings ?? [])
        .filter((program) => program.engine_status === ENGINE_STATUS_VALUES.ACTIVE).length
      return likely > 0 ? plural(likely, 'likely-eligible program', 'likely-eligible programs') : 'None likely eligible yet'
    }
    return path.note ?? null
  }

  return (
    <Modal
      isOpen={isOpen}
      toggle={onClose}
      centered
      size="xl"
      className="onb-modal-dialog onb-choice-dialog"
      contentClassName="onb-modal"
      labelledBy="onb-choice-title"
    >
      <ModalBody className="p-0">
        <div className="onb-choice-body">
          {estimate && <span className="onb-choice-pill">Your results are ready</span>}
          <h5 id="onb-choice-title" className="onb-choice-title">
            {estimate
              ? `We identified an estimated ${estimate} in capital access for your business`
              : 'Your results are ready'}
          </h5>
          <p className="onb-choice-lead">
            Your Tier 0 foundation is verified and your credit profile is complete. What are you looking for?
          </p>

          <div className="onb-choice-grid">
            {ONBOARDING_PATHS.map((path) => {
              const meta = metaFor(path)
              const isSelected = selected === path.id
              return (
                <button
                  key={path.id}
                  type="button"
                  className={`onb-path${isSelected ? ' is-selected' : ''}`}
                  onClick={() => onChoose(path.id)}
                  disabled={choosing}
                  aria-pressed={isSelected}
                >
                  {path.recommended && <span className="onb-path-rec">Recommended first</span>}
                  <span className="onb-path-title">{path.title}</span>
                  <span className="onb-path-text">{path.description}</span>
                  <span className="onb-path-foot">
                    {meta && <span className="onb-path-meta">{meta}</span>}
                    <span className="onb-path-go">
                      {isSelected && 'Selected · '}Go to {path.destination}
                      <i className="ri-arrow-right-line" aria-hidden="true"></i>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <p className="onb-choice-disclaimer">{RESULTS_ESTIMATE_DISCLAIMER}</p>
        </div>

        <footer className="onb-modal-foot onb-choice-foot">
          <button type="button" className="onb-btn onb-btn-ghost" onClick={onClose}>
            Decide later
          </button>
        </footer>
      </ModalBody>
    </Modal>
  )
}
