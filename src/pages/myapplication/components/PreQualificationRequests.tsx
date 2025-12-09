import React from 'react'
import { TableLoader } from '../../../components/Loader/TableLoader'
import type { PreQualificationRequest } from '../../../modules/my-application/types'

interface PreQualificationRequestsProps {
  loading: boolean
  data: PreQualificationRequest[]
}

export default function PreQualificationRequests({ loading, data }: PreQualificationRequestsProps) {
  const statusClass = (s: string) => {
    switch (s.toLowerCase()) {
      case 'submitted': return 'badge rounded-pill bg-success-subtle text-success'
      case 'pending': return 'badge rounded-pill bg-warning-subtle text-warning'
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary'
    }
  }

  return (
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader rows={5} columns={6} />
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
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No requests found
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
