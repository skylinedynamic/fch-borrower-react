import React, { useState } from 'react'
import { TableRowsLoader } from '../../../components/Loader/TableRowsLoader'
import type { PreQualificationRequest } from '../../../modules/my-application/types'
import type { Meta } from '../../../modules/my-application/types'
import GlobalPagination from '../../../components/Paginations/GlobalPagination'
import PreQualificationDetailsModal from './PreQualificationDetailsModal'

interface PreQualificationRequestsProps {
  loading: boolean
  data: PreQualificationRequest[]
  meta?: Meta
  onPageChange?: (page: number) => void
}

export default function PreQualificationRequests({ loading, data, meta, onPageChange }: PreQualificationRequestsProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const toggleDetailsModal = () => setDetailsModalOpen(!detailsModalOpen)

  const handleViewDetails = (id: number) => {
    setSelectedRequestId(id)
    setDetailsModalOpen(true)
  }

  const statusClass = (s: string) => {
    switch (s.toLowerCase()) {
      case 'submitted': return 'badge rounded-pill bg-success-subtle text-success'
      case 'pending': return 'badge rounded-pill bg-warning-subtle text-warning'
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary'
    }
  }

  return (
    <>
      <div className="card section-card app-card mb-0">
        <div className="card-header d-flex align-items-center gap-2">
          <i className="ri-flag-2-line text-warning"></i>
          <span className="card-title fw-semibold">Prequalification Requests</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle table-hover table-striped">
              <thead>
                <tr>
                  <th>Funding Type</th>
                  <th>Business Name</th>
                  <th>Industry</th>
                  <th>Date</th>
                  <th>Requested Amount</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowsLoader rows={5} columns={7} />
                ) : (
                  <>
                    {data.map((r) => (
                      <tr key={r.id}>
                        <td>{r.funding_type}</td>
                        <td className="fw-semibold">{r.business_name}</td>
                        <td>{r.industry}</td>
                        <td>{r.date}</td>
                        <td>{r.requested_amount}</td>
                        <td><span className={statusClass(r.status)}>{r.status}</span></td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-soft-primary btn-icon"
                            onClick={() => handleViewDetails(r.id)}
                            title="View Details"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          No requests found
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          {meta && meta.total > 5 && onPageChange && (
            <GlobalPagination meta={meta} onPageChange={onPageChange} />
          )}
        </div>
      </div>

      <PreQualificationDetailsModal
        isOpen={detailsModalOpen}
        toggle={toggleDetailsModal}
        requestId={selectedRequestId}
      />
    </>
  )
}
