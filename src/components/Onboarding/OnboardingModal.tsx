import React from 'react'
import { Modal, ModalBody } from 'reactstrap'
import type { OnboardingStepConfig, OnboardingSuggestion } from '../../modules/onboarding'
import OnboardingStepAction from './OnboardingStepAction'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  suggestion: OnboardingSuggestion
  /** Skips the current step; only offered on steps that allow it. */
  onSkip?: () => void
  skipping?: boolean
  /** Goes back to a skipped step, making it the current step again. */
  onResume?: (step: OnboardingStepConfig) => void
  resuming?: boolean
}

/** The popup behind the Next step button: what to do, why, and what it leads to. */
export default function OnboardingModal({
  isOpen,
  onClose,
  suggestion,
  onSkip,
  skipping = false,
  onResume,
  resuming = false,
}: OnboardingModalProps) {
  const { step, stepNumber, totalSteps, completedSteps, pendingSteps } = suggestion
  const waiting = step.kind === 'wait'

  return (
    <Modal
      isOpen={isOpen}
      toggle={onClose}
      centered
      size="lg"
      className="onb-modal-dialog"
      contentClassName="onb-modal"
      labelledBy="onb-modal-title"
    >
      <ModalBody className="p-0">
        <header className="onb-modal-head">
          <div className="onb-modal-head-main">
            <span className="onb-modal-icon" aria-hidden="true">
              <i className={step.icon}></i>
            </span>
            <div className="min-w-0">
              <div className="onb-modal-eyebrow">
                Getting started · Step {stepNumber} of {totalSteps}
              </div>
              <h5 id="onb-modal-title" className="onb-modal-title">
                {step.title}
              </h5>
            </div>
          </div>
          <button type="button" className="onb-modal-close" onClick={onClose} aria-label="Close">
            <i className="ri-close-line" aria-hidden="true"></i>
          </button>
          <div className="onb-modal-progress" aria-hidden="true">
            <span style={{ width: `${(completedSteps / totalSteps) * 100}%` }}></span>
          </div>
        </header>

        <div className="onb-modal-body">
          {pendingSteps.length > 0 && (
            <section className="onb-pending" aria-labelledby="onb-pending-title">
              <div className="onb-pending-head">
                <h6 id="onb-pending-title" className="onb-pending-title">
                  <i className="ri-error-warning-line" aria-hidden="true"></i> Skipped: still to do
                </h6>
                <span className="onb-pending-note">
                  Your walkthrough finishes once {pendingSteps.length === 1 ? 'it is' : 'they are'} done.
                </span>
              </div>
              <ul className="onb-pending-list">
                {pendingSteps.map((pending) => (
                  <li key={pending.id}>
                    <span className="onb-pending-step">
                      <i className={pending.icon} aria-hidden="true"></i>
                      {pending.title}
                    </span>
                    {onResume && (
                      <button
                        type="button"
                        className="onb-btn onb-btn-primary onb-btn-sm"
                        onClick={() => onResume(pending)}
                        disabled={resuming}
                        aria-label={`Go to this step: ${pending.title}`}
                      >
                        Go to this step <i className="ri-arrow-right-line" aria-hidden="true"></i>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {step.notice && (
            <div className="onb-modal-notice" role="status" aria-labelledby="onb-modal-notice-title">
              <span className="onb-modal-notice-icon" aria-hidden="true">
                <i className={step.notice.icon}></i>
              </span>
              <div>
                <div id="onb-modal-notice-title" className="onb-modal-notice-title">
                  {step.notice.title}
                </div>
                <p className="onb-modal-notice-text">{step.notice.text}</p>
              </div>
            </div>
          )}

          <p className="onb-modal-description">{step.description}</p>
          <p className="onb-modal-why">
            <i className="ri-lightbulb-flash-line" aria-hidden="true"></i>
            <span>{step.why}</span>
          </p>

          <div className="onb-modal-columns">
            <div>
              <h6 className="onb-section-title">{waiting ? 'What happens next' : "What you'll do"}</h6>
              <ol className="onb-todo">
                {step.todo.map((item, index) => (
                  <li key={item}>
                    <span className="onb-todo-index" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="onb-todo-text">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <aside>
              <h6 className="onb-section-title">{waiting ? 'Good to know' : 'What this unlocks'}</h6>
              <div className="onb-unlocks">
                {step.unlocks.map((unlock) => (
                  <div className="onb-unlock" key={unlock.title}>
                    <span className="onb-unlock-icon" aria-hidden="true">
                      <i className={unlock.icon}></i>
                    </span>
                    <div>
                      <div className="onb-unlock-title">{unlock.title}</div>
                      <div className="onb-unlock-text">{unlock.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>

        <footer className="onb-modal-foot">
          {step.skippable && onSkip ? (
            <button type="button" className="onb-skip" onClick={onSkip} disabled={skipping}>
              <i className="ri-skip-forward-line" aria-hidden="true"></i>
              {skipping ? 'Skipping...' : 'Skip for now'}
            </button>
          ) : (
            <span></span>
          )}
          <div className="onb-modal-actions">
            <button type="button" className="onb-btn onb-btn-ghost" onClick={onClose}>
              {waiting ? 'Got it' : 'Later'}
            </button>
            <OnboardingStepAction step={step} onNavigate={onClose} />
          </div>
        </footer>
      </ModalBody>
    </Modal>
  )
}
