import React, { useState } from 'react'
import { TableRowsLoader } from '../../../components/Loader/TableRowsLoader'
import type { PreQualificationRequest, Meta } from '../../../modules/my-application/types'
import PreQualificationDetailsModal from './PreQualificationDetailsModal'

interface PreQualificationRequestsProps {
  loading: boolean
  data: PreQualificationRequest[]
  meta?: Meta
  page: number
  onPageChange: (page: number) => void
}

export default function PreQualificationRequests({ loading, data, meta, page, onPageChange }: PreQualificationRequestsProps) {
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
          <i className="ri-file-list-3-line fs-20 align-middle text-warning"></i>
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

          {/* Pagination Section */}
          {!loading && meta && meta.last_page > 1 && (
            <div className="d-flex justify-content-end">
              <nav aria-label="Prequalification pagination">
                <ul className="pagination pagination-sm gap-1 mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center sk-w-28 sk-h-28 sk-rounded-6"
                      onClick={() => onPageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <i className="ri-arrow-left-s-line fs-16"></i>
                    </button>
                  </li>

                  {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                    .filter(p => {
                      const lastPage = meta.last_page || 1;
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
                            onClick={() => onPageChange(p)}
                          >
                            {p}
                          </button>
                        </li>
                      </React.Fragment>
                    ))
                  }

                  <li className={`page-item ${page === meta.last_page ? 'disabled' : ''}`}>
                    <button
                      className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center sk-w-28 sk-h-28 sk-rounded-6"
                      onClick={() => onPageChange(Math.min(meta.last_page || 1, page + 1))}
                      disabled={page === meta.last_page}
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

      <PreQualificationDetailsModal
        isOpen={detailsModalOpen}
        toggle={toggleDetailsModal}
        requestId={selectedRequestId}
      />
    </>
  )
}
