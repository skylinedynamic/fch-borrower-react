import React, { useState } from 'react'
import { usePreQualificationRequests } from '../../modules/my-application'
import { useFundingApplications } from '../../modules/my-application/queries'
import MyApplicationsHero from './components/MyApplicationsHero'
import PreQualificationRequests from './components/PreQualificationRequests'
import FundingApplications from './components/FundingApplications'
import RightSideSection from './components/RightSideSection'
import './MyApplications.css'

export default function MyApplication() {
  const [prequalPage, setPrequalPage] = useState(1)
  const { data: prequalData, isLoading: prequalLoading } = usePreQualificationRequests(prequalPage)
  // The list asks for the same first page, so the total costs no extra request.
  const { data: fundingFirstPage } = useFundingApplications(1)

  return (
    <div className="page-content myapplications-page ma-page">
      <div className="container-fluid">
        <MyApplicationsHero prequalTotal={prequalData?.meta?.total} fundingTotal={fundingFirstPage?.meta?.total} />

        <div className="row g-4">
          {/* Advisor above the lists as a compact strip; beside them from 1400px. */}
          <div className="col-xxl-3 order-xxl-2">
            <RightSideSection />
          </div>

          <div className="col-xxl-9 order-xxl-1 min-w-0">
            <PreQualificationRequests
              loading={prequalLoading}
              data={prequalData?.data || []}
              meta={prequalData?.meta}
              page={prequalPage}
              onPageChange={setPrequalPage}
            />
            <FundingApplications />
          </div>
        </div>
      </div>
    </div>
  )
}
