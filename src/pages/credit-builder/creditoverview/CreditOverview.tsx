import React, { useEffect } from 'react'
import ActivityLog from '../../../components/ActivityLog/ActivityLog'
import RecommendedActions from '../../../components/RecommendedActions/RecommendedActions'
import CreditProgress from './components/CreditProgress'
import TaskStatusCards from './components/TaskStatusCards'
import VideoPlayerSection from './components/VideoPlayerSection'

export default function CreditOverview() {
  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch {}
      })
    }
  }, [])

  return (
    <div className="page-content credit-overview-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <div>
                <h4 className="fs-20 mb-1">Credit Building Overview</h4>
                <p className="text-muted mb-0">Tracks your business credit journey from startup to mature credit profile</p>
              </div>
            </div>
          </div>
          <div className="col-xl-12">
            <CreditProgress />
            <TaskStatusCards />
            <VideoPlayerSection />
          </div>
          {/* <div className="col-xl-3">
            <ActivityLog />
            <RecommendedActions />
          </div> */}
        </div>
      </div>
    </div>
  )
}
