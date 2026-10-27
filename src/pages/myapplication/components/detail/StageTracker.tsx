import React from 'react'
import { FUNDING_APPLICATION_STAGES, fundingApplicationStage } from '../../../../modules/my-application'

/** Where a funding application stands: six milestones, the current one marked. */
export default function StageTracker({ status }: { status: string }) {
  const { index, denied, actionRequired } = fundingApplicationStage(status)

  return (
    <div className={`ma-tracker ${denied ? 'is-denied' : ''}`}>
      <ol className="ma-tracker-steps" aria-label="Application progress">
        {FUNDING_APPLICATION_STAGES.map((stage, i) => {
          const state = i < index ? 'is-done' : i === index ? (denied ? 'is-denied' : 'is-current') : 'is-upcoming'
          return (
            <li key={stage.label} className={`ma-tracker-step ${state}`} aria-current={i === index ? 'step' : undefined}>
              <span className="ma-tracker-dot" aria-hidden="true">
                {state === 'is-done' ? <i className="ri-check-line"></i> : state === 'is-denied' ? <i className="ri-close-line"></i> : i + 1}
              </span>
              <span className="ma-tracker-label">{stage.label}</span>
            </li>
          )
        })}
      </ol>

      {denied ? (
        <p className="ma-tracker-note is-denied" role="status">
          <i className="ri-close-circle-line" aria-hidden="true"></i>
          <span><strong>Application denied</strong> - your advisor can talk you through the next options.</span>
        </p>
      ) : actionRequired ? (
        <p className="ma-tracker-note is-action" role="status">
          <i className="ri-error-warning-line" aria-hidden="true"></i>
          <span><strong>Action needed:</strong> {status}. Check your documents and upload what is missing.</span>
        </p>
      ) : (
        <p className="ma-tracker-note">
          <span>Current status: <strong>{status}</strong></span>
        </p>
      )}
    </div>
  )
}
