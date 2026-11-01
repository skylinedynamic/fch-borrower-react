import React from 'react'
import CreditProgress from './components/CreditProgress'
import TaskStatusCards from './components/TaskStatusCards'
import VideoPlayerSection from './components/VideoPlayerSection'
import './CreditOverview.css'

/**
 * Credit Builder › Overview: overall progress, the tier roadmap and the current
 * tier (CreditProgress), the borrower's task activity, and the training videos.
 */
export default function CreditOverview() {
  return (
    <div className="page-content credit-overview-page co-page">
      <div className="container-fluid">
        <CreditProgress />
        <TaskStatusCards />
        <VideoPlayerSection />
      </div>
    </div>
  )
}
