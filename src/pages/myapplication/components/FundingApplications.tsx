import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFundingApplications } from '../../../modules/my-application/queries'
import type { FundingApplication } from '../../../modules/my-application/types'
import { TableRowsLoader } from '../../../components/Loader/TableRowsLoader'
import GlobalPagination from '../../../components/Paginations/GlobalPagination'
import FundingApplicationDetailsModal from './FundingApplicationDetailsModal'
import { FUNDING_APPLICATION_STATUS, FUNDING_APPLICATION_STATUS_CLASS_MAP } from '../../../config/funding'

export default function FundingApplications() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useFundingApplications(page)
  // Modal approach removed in favor of dedicated details page

  const statusClass = (s: string) => {
    const customClass = FUNDING_APPLICATION_STATUS_CLASS_MAP[s];
    return customClass ? `badge rounded-pill ${customClass}` : 'badge rounded-pill bg-secondary-subtle text-secondary';
  }

  // Map API data to table rows
  const rows = data?.data || []

  // An application the borrower started but has not submitted (On Hold) is
  // continued from its funding request, as on the Funding Request list - it
  // has nothing to view yet (BUG-027).
  const continueUrl = (app: FundingApplication) =>
    app.status === FUNDING_APPLICATION_STATUS.ON_HOLD && app.funding_request_id ? `/fund-application/${app.funding_request_id}` : null

  return (
    <>
      <div className="card section-card app-card mt-3">
        <div className="card-header d-flex align-items-center gap-2">
          <i className="ri-bank-line fs-20 align-middle text-warning"></i>
          <span className="card-title fw-semibold">Funding Applications</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle table-hover table-striped">
              <thead>
                <tr>
                  <th>Funding Type</th>
                  <th>Entity Type</th>
                  <th>Industry</th>
                  <th>Date</th>
                  <th>Requested Amount</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableRowsLoader rows={5} columns={7} />
                ) : (
                  <>
                    {rows.length > 0 ? (
                      rows.map((app: FundingApplication) => (
                        <tr 
                          key={app.id} 
                          onClick={() => navigate(continueUrl(app) ?? `/my-applications/funding/${app.id}`)}
                          style={{ cursor: 'pointer' }}
                          className="fr-table-row-hover"
                        >
                          <td>{app.purpose_of_funds || 'N/A'}</td>
                          <td>{app.entity_type || 'N/A'}</td>
                          <td>{app.industry_type || 'N/A'}</td>
                          <td>{app.date || 'N/A'}</td>
                          <td>{app.requested_amount || 'N/A'}</td>
                          <td><span className={statusClass(app.status)}>{app.status}</span></td>
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            {continueUrl(app) ? (
                              <Link
                                to={continueUrl(app) as string}
                                className="btn btn-success btn-sm text-nowrap d-inline-flex align-items-center"
                                title="Continue Application"
                              >
                                Continue Application <i className="ri-arrow-right-line ms-1"></i>
                              </Link>
                            ) : (
                              <Link to={`/my-applications/funding/${app.id}`} className="btn btn-light btn-sm fr-download-btn">
                                <i className="ri-eye-line align-middle"></i>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No funding applications found.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          {!isLoading && data?.meta && data.meta.last_page > 1 && (
            <div className="d-flex justify-content-end">
              <nav aria-label="Funding applications pagination">
                <ul className="pagination pagination-sm gap-1 mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center sk-w-28 sk-h-28 sk-rounded-6"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <i className="ri-arrow-left-s-line fs-16"></i>
                    </button>
                  </li>

                  {Array.from({ length: data.meta.last_page }, (_, i) => i + 1)
                    .filter(p => {
                      const lastPage = data.meta?.last_page || 1;
                      return p === 1 || p === lastPage || (p >= page - 1 && p <= page + 1);
                    })
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <li className="page-item disabled">
                            <span className="page-link border-0 bg-transparent px-2 align-self-center">...</span>
                          </li>
                        )}
                        <li className={`page-item ${page === p ? 'active' : ''}`}>
                          <button
                            className={`page-link border-0 shadow-sm d-flex align-items-center justify-content-center fw-bold sk-w-28 sk-h-28 sk-rounded-6 ${page === p ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        </li>
                      </React.Fragment>
                    ))
                  }

                  <li className={`page-item ${page === data.meta.last_page ? 'disabled' : ''}`}>
                    <button
                      className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center sk-w-28 sk-h-28 sk-rounded-6"
                      onClick={() => setPage(Math.min(data.meta?.last_page || 1, page + 1))}
                      disabled={page === data.meta.last_page}
                    >
                      <i className="ri-arrow-right-s-line fs-16"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
