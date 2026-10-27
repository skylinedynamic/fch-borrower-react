import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFundingApplications } from '../../../modules/my-application/queries'
import type { FundingApplication } from '../../../modules/my-application/types'
import { TableRowsLoader } from '../../../components/Loader/TableRowsLoader'
import { FUNDING_APPLICATION_STATUS, FUNDING_APPLICATION_STATUS_CLASS_MAP } from '../../../config/funding'
import SectionPagination from './SectionPagination'

const COLUMNS = ['Funding Type', 'Entity Type', 'Industry', 'Date', 'Requested Amount', 'Status']

const statusClass = (s: string) => `badge ${FUNDING_APPLICATION_STATUS_CLASS_MAP[s] ?? 'bg-secondary-subtle text-secondary'}`

// An application the borrower started but has not submitted (On Hold) is
// continued from its funding request, as on the Funding Request list - it has
// nothing to view yet (BUG-027).
const continueUrl = (app: FundingApplication) =>
  app.status === FUNDING_APPLICATION_STATUS.ON_HOLD && app.funding_request_id ? `/fund-application/${app.funding_request_id}` : null

export default function FundingApplications() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useFundingApplications(page)
  const rows: FundingApplication[] = data?.data || []

  return (
    <section className="ma-card" aria-labelledby="ma-funding-title">
      <header className="ma-card-head">
        <span className="ma-card-icon" aria-hidden="true"><i className="ri-bank-line"></i></span>
        <div className="min-w-0">
          <h5 id="ma-funding-title" className="ma-card-title">Funding Applications</h5>
          <p className="ma-card-subtitle">Applications in progress with our lending partners</p>
        </div>
        {!isLoading && data?.meta && <span className="ma-card-count">{data.meta.total} total</span>}
      </header>

      <div className="ma-card-body">
        {!isLoading && rows.length === 0 ? (
          <div className="ma-empty">
            <span className="ma-empty-icon" aria-hidden="true"><i className="ri-bank-line"></i></span>
            <p className="ma-empty-title">No funding applications yet</p>
            <p className="ma-empty-text">An application appears here once you start one from an approved funding request.</p>
          </div>
        ) : (
          <div className="ma-table-wrap">
            <table className="ma-table">
            <thead>
              <tr>
                {COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowsLoader rows={3} columns={6} />
              ) : (
                rows.map((app) => {
                  // An On Hold application is continued; any other is opened. The whole
                  // row goes there; its title is the link for the keyboard.
                  const target = continueUrl(app) ?? `/my-applications/funding/${app.id}`

                  return (
                    <tr key={app.id} className="ma-row-link" onClick={() => navigate(target)}>
                      <td data-label="Funding Type">
                        <Link to={target} className="ma-row-title" onClick={(e) => e.stopPropagation()}>{app.preferred_funding_type || 'N/A'}</Link>
                      </td>
                      <td data-label="Entity Type">{app.entity_type || 'N/A'}</td>
                      <td data-label="Industry">{app.industry_type || 'N/A'}</td>
                      <td data-label="Date" className="ma-nowrap">{app.date || 'N/A'}</td>
                      <td data-label="Requested Amount"><span className="ma-amount">{app.requested_amount || 'N/A'}</span></td>
                      <td data-label="Status"><span className={statusClass(app.status)}>{app.status}</span></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
            </div>
        )}
      </div>

      {!isLoading && <SectionPagination meta={data?.meta} page={page} onPageChange={setPage} label="Funding applications" />}
    </section>
  )
}
