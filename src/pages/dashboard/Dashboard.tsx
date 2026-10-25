import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted } from '../../lib/auth/subscriptionUtils'
import { useActiveFundingRequests, useDashboard } from '../../modules/dashboard'
import { useCapitalAccessOverview } from '../../modules/capital-access/queries'
import type { FundingApplication, PreQualification } from '../../modules/dashboard/types'
import DashboardLoader from '../../components/Loader/DashboardLoader'
import DashboardHero from './components/DashboardHero'
import PendingInvoiceAlert from './components/PendingInvoiceAlert'
import KpiCards from './components/KpiCards'
import CreditProfileCard from './components/CreditProfileCard'
import ApplicationsTable, { type ApplicationColumn } from './components/ApplicationsTable'
import ApprovedRequestCard from './components/ApprovedRequestCard'
import UpcomingMeetingsCard from './components/UpcomingMeetingsCard'
import InvoicesCard from './components/InvoicesCard'
import SupportCard from './components/SupportCard'
import {
  countPendingInvoices,
  formatUsd,
  shouldShowPendingInvoiceAlert,
  toFicoDisplay,
  toMeeting,
  toNumber,
} from './dashboardMappers'
import './Dashboard.css'

/** Two facts about the business in one cell: structure/entity, then industry. */
function BusinessCell({ main, sub }: { main: React.ReactNode; sub: React.ReactNode }) {
  return (
    <div className="db-cell-stack">
      <span>{main}</span>
      <small>{sub}</small>
    </div>
  )
}

const preQualificationColumns: ApplicationColumn<PreQualification>[] = [
  { header: 'Funding Type', primary: true, render: (r) => r.purpose_of_funding || 'N/A' },
  { header: 'Date', nowrap: true, render: (r) => r.formatted_created_at },
  {
    header: 'Business',
    render: (r) => <BusinessCell main={r.business_structure || 'N/A'} sub={r.industry_type || 'N/A'} />,
  },
  { header: 'Requested Amount', align: 'end', render: (r) => formatUsd(toNumber(r.funding_requested_amount)) },
]

const fundingApplicationColumns: ApplicationColumn<FundingApplication>[] = [
  { header: 'Funding Type', primary: true, render: (r) => r.purpose_of_funds },
  { header: 'Date', nowrap: true, render: (r) => r.formatted_created_at },
  { header: 'Business', render: (r) => <BusinessCell main={r.entity_type} sub={r.industry_type} /> },
  { header: 'Requested', align: 'end', render: (r) => formatUsd(toNumber(r.requested_amount)) },
  { header: 'Funded', align: 'end', render: (r) => formatUsd(toNumber(r.total_funded_amount)) },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const userSubscription = useAuthStore((state) => state.userSubscription)
  const isRestricted = isSubscriptionRestricted(userSubscription)

  const [activeRequestIndex, setActiveRequestIndex] = useState(0)

  const { data: dashboardData, isLoading, error } = useDashboard()
  // The same cached query as the layout's banner: no extra request.
  const { data: activeFundingRequests } = useActiveFundingRequests()
  const { data: overview } = useCapitalAccessOverview()

  if (isLoading) {
    return <DashboardLoader />
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error loading dashboard</h4>
            <p>{error.message || 'Failed to load dashboard data. Please try again later.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const data = dashboardData?.data
  const invoices = data?.invoices ?? []
  const showInvoiceAlert = shouldShowPendingInvoiceAlert({
    isRestricted,
    partnerType: user?.partner_type as string | undefined,
    invoices,
  })
  // Not paid yet (subscription not active, or asked to pay an invoice): the
  // payment comes first, so there is no strategy to start.
  const awaitingPayment = isRestricted || showInvoiceAlert

  const active = activeFundingRequests?.data
  const approvedRequests = active?.active_approved_funding_requests ?? []
  const approvedCount = active?.active_approved_funding_request_count ?? 0
  const currentApproved = approvedRequests[activeRequestIndex] ?? active?.active_approved_funding_request ?? null

  const meetings = (data?.upcoming_meeting ?? []).map(toMeeting)

  const approvedCard = currentApproved && (
    <ApprovedRequestCard
      request={currentApproved}
      index={activeRequestIndex}
      count={approvedCount}
      onPrev={() => setActiveRequestIndex((i) => Math.max(0, i - 1))}
      onNext={() => setActiveRequestIndex((i) => Math.min(approvedCount - 1, i + 1))}
      onProcess={() => navigate(`/fund-application/${currentApproved.id}`)}
    />
  )


  return (
    <div className="page-content dashboard-page db-page">
      <div className="container-fluid">
        {showInvoiceAlert && (
          <PendingInvoiceAlert count={countPendingInvoices(invoices)} onPay={() => navigate('/invoices')} />
        )}

        <DashboardHero
          name={user?.name}
          score={overview?.readiness_score ?? 0}
          status={overview?.readiness_status ?? 'N/A'}
          totalAccess={overview?.estimated_total_access ?? '$0'}
          hasActivePlay={!!overview?.current_play}
          onOpenCapitalAccess={awaitingPayment ? undefined : () => navigate('/credit-card-stacking')}
        />

        {data && <KpiCards stats={data.states} />}

        {approvedCard}

        <div className="row g-3 mb-3">
          <div className="col-xl-6 d-flex db-stretch">
            <CreditProfileCard fico={toFicoDisplay(data?.fico_score)} tier={data?.tier} />
          </div>
          <div className={`${invoices.length > 0 ? 'col-xl-3' : 'col-xl-6'} col-md-6 d-flex db-stretch`}>
            <UpcomingMeetingsCard meetings={meetings} onSchedule={() => navigate('/appointment')} />
          </div>
          {invoices.length > 0 && (
            <div className="col-xl-3 col-md-6 d-flex db-stretch">
              <InvoicesCard invoices={invoices} />
            </div>
          )}
        </div>

        <div className="row g-3 mb-3">
          <div className="col-xl-6 d-flex db-stretch">
            <ApplicationsTable
              widget="pre-qualifications"
              title="Pre-Qualification Applications"
              icon="ri-shield-check-line"
              rows={data?.latest_pre_qualifications ?? []}
              columns={preQualificationColumns}
              emptyTitle="No Pre-Qualification Applications"
              emptyMessage="No applications available at this time."
              onViewAll={() => navigate('/my-applications')}
            />
          </div>
          <div className="col-xl-6 d-flex db-stretch">
            <ApplicationsTable
              widget="funding-applications"
              title="Recent Funding Applications"
              icon="ri-exchange-dollar-line"
              tone="violet"
              rows={data?.latest_funding_applications ?? []}
              columns={fundingApplicationColumns}
              emptyTitle="No Funding Applications"
              emptyMessage="No recent funding applications available."
              onViewAll={() => navigate('/my-applications')}
            />
          </div>
        </div>

        <SupportCard onContact={() => navigate('/appointment')} />
      </div>
    </div>
  )
}
