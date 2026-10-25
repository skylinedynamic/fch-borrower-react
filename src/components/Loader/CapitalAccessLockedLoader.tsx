import React from 'react'
import { CapitalAccessLockedHead } from '../CapitalAccess/CapitalAccessLocked'
import '../CapitalAccess/CapitalAccessLocked.css'

// Mirrors the locked Credit Card Stacking screen (CapitalAccessLocked): the
// same page head, then the card with its summary, the four-step stepper and
// the help strip, so nothing moves when the content arrives.

const Line = ({ w, h, className = '' }: { w: number | string; h: number; className?: string }) => (
  <div className={`skeleton-line ${className}`} style={{ width: w, height: h }} />
)

export default function CapitalAccessLockedLoader() {
  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="cal-shell" role="status" aria-label="Loading Credit Card Stacking">
          <CapitalAccessLockedHead />

          <div className="cal-card" aria-hidden="true">
            <div className="cal-summary">
              <Line w={72} h={72} />
              <div>
                <Line w={130} h={20} className="mb-2" />
                <Line w="min(380px, 80%)" h={20} className="mb-3" />
                <Line w="95%" h={12} className="mb-2" />
                <Line w="70%" h={12} />
              </div>
              <div className="cal-progress">
                <Line w={76} h={76} className="cal-sk-round" />
                <Line w={70} h={12} />
              </div>
            </div>

            <div className="cal-steps">
              <div className="cal-steps-head">
                <Line w={200} h={16} className="mb-2" />
                <Line w="min(420px, 70%)" h={12} />
              </div>
              <ol className="cal-list">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="cal-item">
                    <div className="cal-item-top">
                      <Line w={36} h={36} className="cal-sk-round" />
                      <Line w={52} h={14} />
                    </div>
                    <div className="cal-item-body cal-sk-body">
                      <Line w="70%" h={14} className="mb-2" />
                      <Line w="95%" h={11} className="mb-1" />
                      <Line w="60%" h={11} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="cal-help">
              <Line w={32} h={32} className="cal-sk-round" />
              <Line w="min(460px, 75%)" h={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
