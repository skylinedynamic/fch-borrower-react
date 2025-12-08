import React from 'react'

interface PreQualificationRequestsProps {
  loading: boolean
  rows: Array<{
    type: string
    business: string
    industry: string
    date: string
    amount: string
    status: string
  }>
}

export default function PreQualificationRequests({ loading, rows }: PreQualificationRequestsProps) {
  const statusClass = (s: string) =>
    s === 'Submitted' ? 'badge rounded-pill bg-success-subtle text-success' : 'badge rounded-pill bg-warning-subtle text-warning'

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
            {loading ? (
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td><div className="skeleton-line w-75"></div></td>
                    <td><div className="skeleton-line w-50"></div></td>
                    <td><div className="skeleton-line w-60"></div></td>
                    <td><div className="skeleton-line w-40"></div></td>
                    <td><div className="skeleton-line w-50"></div></td>
                    <td><div className="skeleton-line w-30"></div></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.type}-${r.business}-${r.date}`}>
                    <td>{r.type}</td>
                    <td className="fw-semibold">{r.business}</td>
                    <td>{r.industry}</td>
                    <td>{r.date}</td>
                    <td>{r.amount}</td>
                    <td><span className={statusClass(r.status)}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
