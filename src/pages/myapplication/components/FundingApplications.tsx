import React, { useState } from 'react'
import { useFundingApplications } from '../../../modules/my-application/queries'
import type { FundingApplication } from '../../../modules/my-application/types'
import { TableRowsLoader } from '../../../components/Loader/TableRowsLoader'
import GlobalPagination from '../../../components/Paginations/GlobalPagination'
import FundingApplicationDetailsModal from './FundingApplicationDetailsModal'
import { FUNDING_APPLICATION_STATUS_CLASS_MAP } from '../../../config/funding'

export default function FundingApplications() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useFundingApplications(page, 5)
  const [selectedApplication, setSelectedApplication] = useState<FundingApplication | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const toggleDetailsModal = () => setDetailsModalOpen(!detailsModalOpen)

  const handleViewDetails = (app: FundingApplication) => {
    setSelectedApplication(app)
    setDetailsModalOpen(true)
  }

  const statusClass = (s: string) => {
    const customClass = FUNDING_APPLICATION_STATUS_CLASS_MAP[s];
    return customClass ? `badge rounded-pill ${customClass}` : 'badge rounded-pill bg-secondary-subtle text-secondary';
  }

  // Map API data to table rows
  const rows = data?.data || []

  return (
    <>
      <div className="card section-card app-card mt-3">
        <div className="card-header d-flex align-items-center gap-2">
          <i className="ri-bank-card-line text-warning"></i>
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
                        <tr key={app.id}>
                          <td>{app.purpose_of_funds || 'N/A'}</td>
                          <td>{app.entity_type || 'N/A'}</td>
                          <td>{app.industry_type || 'N/A'}</td>
                          <td>{app.date || 'N/A'}</td>
                          <td>{app.requested_amount || 'N/A'}</td>
                          <td><span className={statusClass(app.status)}>{app.status}</span></td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-soft-primary btn-icon"
                              onClick={() => handleViewDetails(app)}
                              title="View Details"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
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
          {data?.meta && data.meta.total > 5 && (
            <GlobalPagination meta={data.meta} onPageChange={setPage} />
          )}
        </div>
      </div>

      <FundingApplicationDetailsModal
        isOpen={detailsModalOpen}
        toggle={toggleDetailsModal}
        application={selectedApplication}
      />
    </>
  )
}
