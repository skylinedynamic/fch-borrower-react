import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePreQualificationRequests } from '../../modules/my-application'
import PreQualificationRequests from './components/PreQualificationRequests'
import FundingApplications from './components/FundingApplications'
import RightSideSection from './components/RightSideSection'

export default function MyApplication() {
  const [prequalPage, setPrequalPage] = useState(1)
  const { data: prequalData, isLoading: prequalLoading } = usePreQualificationRequests(prequalPage)

  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="page-content myapplications-page">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between py-2">
          <div>
            <h4 className="mb-1">My Applications</h4>
            <div className="text-muted">Track your funding applications and their current status</div>
          </div>
          <Link to="/pre-qualification" className="btn primary-btn">Apply New Prequalification</Link>
        </div>

        <div className="row g-4">
          <div className="col-xl-8 col-xxl-9 order-1">
            <PreQualificationRequests
              loading={prequalLoading}
              data={prequalData?.data || []}
              meta={prequalData?.meta}
              page={prequalPage}
              onPageChange={setPrequalPage}
            />
            <FundingApplications />
          </div>

          <div className="col-xl-4 col-xxl-3 order-2">
            <RightSideSection loading={loading} />
          </div>


          <div className="col-12 d-xl-none order-3">
            <div className="card app-card mt-0 ad-card">
              <div className="card-header">
                <span className="card-title fw-semibold">Advertisements</span>
              </div>
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="ad-placeholder">Ad space</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

