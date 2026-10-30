import React from 'react'
import { Link } from 'react-router-dom'
import { CREDIT_PROFILE_FORM_ROUTE } from '../../../config/profileRoutes'
import '../Funding.css'
import './FundingLocked.css'

interface FundingLockedProps {
  /** Whether the borrower has done their part: the credit profile form. */
  creditProfileSubmitted: boolean
}

type StepState = 'done' | 'current' | 'upcoming'

interface Step {
  title: string
  text: string
  state: StepState
  /** What the state reads as while it is the current step. */
  currentLabel: string
}

const STATE_ICON: Record<StepState, string> = {
  done: 'ri-check-line',
  current: 'ri-time-line',
  upcoming: 'ri-lock-line',
}

const stateLabel = (step: Step) => (step.state === 'done' ? 'Done' : step.state === 'current' ? step.currentLabel : 'To do')

/** The three steps before Funding opens, and where the borrower stands. */
const buildSteps = (creditProfileSubmitted: boolean): Step[] => [
  {
    title: 'Submit your credit profile',
    text: 'The Credit Profile form on your profile.',
    state: creditProfileSubmitted ? 'done' : 'current',
    currentLabel: 'Next',
  },
  {
    title: 'We upload your credit report',
    text: 'Our team pulls it and adds it to your account.',
    state: creditProfileSubmitted ? 'current' : 'upcoming',
    currentLabel: 'In progress',
  },
  {
    title: 'Funding opens',
    text: 'The programs your business is likely eligible for.',
    state: 'upcoming',
    currentLabel: 'Next',
  },
]

/** Faded program cards under the panel: what opens, not real data. */
const PREVIEW_CARDS = 4

/**
 * Funding before the borrower's credit report is uploaded. Without it every
 * funding criterion reads "Failed", so the page waits for it. It keeps the
 * Funding Options banner; where the overview figures sit, a panel says what
 * it waits for and where the borrower stands, with a faded preview of the
 * program cards below.
 */
export default function FundingLocked({ creditProfileSubmitted }: FundingLockedProps) {
  const steps = buildSteps(creditProfileSubmitted)

  return (
    <div className="page-content funding-page funding-locked-page">
      <div className="container-fluid">
        <div className="fp-shell">
          <header className="fp-hero">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb fp-breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Funding Options
                </li>
              </ol>
            </nav>
            <h4 className="fp-title">Funding Options</h4>
            <p className="fp-lead">Compare the programs open to your business and start a funding request.</p>
          </header>

          <section className="fl-panel" aria-labelledby="funding-locked-title">
            <div className="fl-main">
              {/* The icon, with the status, title and text beside it. */}
              <div className="fl-media">
                <span className="fl-icon" aria-hidden="true">
                  <i className="ri-file-search-line"></i>
                </span>
                <div className="fl-main-body">
                  <span className={`fl-badge ${creditProfileSubmitted ? 'is-waiting' : 'is-action'}`}>
                    <span className="fl-badge-dot" aria-hidden="true"></span>
                    {creditProfileSubmitted ? 'In progress' : 'Action needed'}
                  </span>
                  <h3 id="funding-locked-title" className="fl-title">
                    Funding opens once your credit report is uploaded
                  </h3>
                  <p className="fl-text">
                    {creditProfileSubmitted
                      ? 'Our team is preparing your credit report. Once it is uploaded, your funding programs show here.'
                      : 'Submit your credit profile first. Our team then uploads your credit report, and your funding programs show here.'}
                  </p>
                  {!creditProfileSubmitted && (
                    <Link to={CREDIT_PROFILE_FORM_ROUTE} className="fl-cta">
                      Fill Credit Profile <i className="ri-arrow-right-line" aria-hidden="true"></i>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="fl-steps">
              <p id="funding-locked-steps" className="fl-steps-title">
                Before Funding opens
              </p>
              <ol className="fl-timeline" aria-labelledby="funding-locked-steps">
                {steps.map((step) => (
                  <li
                    key={step.title}
                    className={`fl-step is-${step.state}`}
                    aria-current={step.state === 'current' ? 'step' : undefined}
                  >
                    <span className="fl-step-marker" aria-hidden="true">
                      <i className={STATE_ICON[step.state]}></i>
                    </span>
                    <div className="fl-step-body">
                      <div className="fl-step-head">
                        <span className="fl-step-title">{step.title}</span>
                        <span className="fl-step-state">{stateLabel(step)}</span>
                      </div>
                      <p className="fl-step-text">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <div className="fl-preview" aria-hidden="true">
            <div className="fp-grid">
              {Array.from({ length: PREVIEW_CARDS }).map((_, i) => (
                <div key={i} className="fl-ghost-card">
                  <div className="fl-ghost-top">
                    <span className="fl-ghost-icon"></span>
                    <span className="fl-ghost-line" style={{ width: '62%' }}></span>
                  </div>
                  <span className="fl-ghost-line" style={{ width: '88%' }}></span>
                  <span className="fl-ghost-line" style={{ width: '70%' }}></span>
                  <div className="fl-ghost-bottom">
                    <span className="fl-ghost-line" style={{ width: 96, height: 18 }}></span>
                    <span className="fl-ghost-round"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
