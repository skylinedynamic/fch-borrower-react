import React from 'react'
import Skeleton, { HeroSkeleton, SectionSkeleton } from './detail/Skeleton'
import '../MyApplications.css'

/** Funding Application Details while it loads, in the page's own shape. */
export default function FundingApplicationDetailLoader() {
  return (
    <div className="page-content ma-page" role="status" aria-label="Loading the funding application">
      <div className="container-fluid">
        <HeroSkeleton />

        <div className="ma-tracker">
          <ol className="ma-tracker-steps">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="ma-tracker-step">
                <Skeleton w={32} h={32} round />
                <Skeleton w={70} h={11} />
              </li>
            ))}
          </ol>
          <Skeleton w="100%" h={38} />
        </div>

        <div className="row g-4">
          <div className="col-xl-8 min-w-0">
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={3} />
          </div>
          <div className="col-xl-4">
            <div className="ma-card ma-activity">
              <div className="ma-card-head">
                <Skeleton w={38} h={38} />
                <Skeleton w={120} h={16} />
              </div>
              <div className="ma-activity-body">
                <Skeleton w={90} h={10} className="my-3" />
                <ul className="ma-activity-list">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="ma-activity-item">
                      <Skeleton w={32} h={32} round />
                      <div className="ma-activity-main">
                        <Skeleton w="85%" h={13} />
                        <Skeleton w="45%" h={11} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
