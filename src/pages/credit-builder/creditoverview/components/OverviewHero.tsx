import React from 'react'
import { Link } from 'react-router-dom'
import type { CreditProgressData } from '../../../../modules/credit-builder/overview/types'
import ProgressRing from './ProgressRing'

const GUIDE_PATH = '/credit-builder/guide'

/**
 * The Overview's header: what the page is, where the borrower stands overall
 * - the same overall progress the Step-By-Step Guide shows (BUG-024) - and the
 * way into the Guide. Rendered while the progress loads too, so the title is
 * always there.
 */
export default function OverviewHero({ progress }: { progress?: CreditProgressData }) {
  const totalTasks = progress ? progress.total_complete_task + progress.total_tasks_remaining : 0

  return (
    <section className="co-hero credit-progress">
      <span className="co-hero-orb" aria-hidden="true"></span>
      <div className="co-hero-main">
        <span className="co-hero-eyebrow">
          <i className="ri-building-2-line" aria-hidden="true"></i> Credit Builder
        </span>
        <h1 className="co-hero-title">Credit Building Overview</h1>
        <p className="co-hero-subtitle">Tracks your business credit journey from startup to mature credit profile</p>
        {progress && (
          <div className="co-hero-tier">
            <span className="co-hero-tier-badge">
              <i className="ri-vip-crown-2-line" aria-hidden="true"></i> {progress.name}
            </span>
            <span className="co-hero-tier-title">{progress.title}</span>
          </div>
        )}
      </div>

      <div className="co-hero-journey">
        {progress ? (
          <>
            <ProgressRing value={progress.total_complete_percentage} label="Overall progress" className="co-hero-ring">
              <strong>{progress.total_complete_percentage}%</strong>
              <span>Overall</span>
            </ProgressRing>
            <div className="co-hero-journey-text">
              <span className="co-hero-journey-label">Your journey</span>
              <span className="co-hero-journey-count">
                {progress.total_complete_task} of {totalTasks} tasks verified
              </span>
              <Link to={GUIDE_PATH} className="co-btn co-btn-light">
                Open Step-By-Step Guide <i className="ri-arrow-right-line" aria-hidden="true"></i>
              </Link>
            </div>
          </>
        ) : (
          <div className="co-hero-journey-skeleton" aria-hidden="true">
            <span className="co-sk co-sk-ring"></span>
            <span className="co-sk co-sk-line"></span>
          </div>
        )}
      </div>
    </section>
  )
}
