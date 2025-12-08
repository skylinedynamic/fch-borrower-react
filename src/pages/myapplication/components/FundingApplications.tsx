import React from 'react'

interface FundingApplicationsProps {
  loading: boolean
  rows: Array<{
    type: string
    entity: string
    inc: string
    date: string
    amount: string
    status: string
  }>
}

export default function FundingApplications({ loading, rows }: FundingApplicationsProps) {
  const statusClass = (s: string) =>
    s === 'Submitted' ? 'badge rounded-pill bg-success-subtle text-success' : 'badge rounded-pill bg-warning-subtle text-warning'

  return (
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
                <th className="text-center"></th>
                <th>Funding Type</th>
                <th>Entity Type</th>
                <th>Incorporation</th>
                <th>Date</th>
                <th>Requested Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td className="text-center"><div className="skeleton-circle small-circle"></div></td>
                    <td><div className="skeleton-line w-75"></div></td>
                    <td><div className="skeleton-line w-60"></div></td>
                    <td><div className="skeleton-line w-50"></div></td>
                    <td><div className="skeleton-line w-40"></div></td>
                    <td><div className="skeleton-line w-50"></div></td>
                    <td><div className="skeleton-line w-30"></div></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.type}-${r.entity}-${r.date}`}>
                    <td className="text-center"><input type="checkbox" className="form-check-input" aria-label="Select row" /></td>
                    <td>{r.type}</td>
                    <td>{r.entity}</td>
                    <td>{r.inc}</td>
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
