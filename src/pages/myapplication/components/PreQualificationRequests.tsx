import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { TableRowsLoader } from '../../../components/Loader/TableRowsLoader'
import type { PreQualificationRequest, Meta } from '../../../modules/my-application/types'
import PreQualificationDetailsModal from './PreQualificationDetailsModal'
import SectionPagination from './SectionPagination'

interface PreQualificationRequestsProps {
  loading: boolean
  data: PreQualificationRequest[]
  meta?: Meta
  page: number
  onPageChange: (page: number) => void
}

const COLUMNS = ['Funding Type', 'Business Name', 'Industry', 'Date', 'Requested Amount', 'Status']

const statusClass = (s: string) => {
  switch (s.toLowerCase()) {
    case 'submitted':
    case 'approved': return 'badge bg-success-subtle text-success'
    case 'pending': return 'badge bg-warning-subtle text-warning'
    case 'rejected':
    case 'declined': return 'badge bg-danger-subtle text-danger'
    default: return 'badge bg-secondary-subtle text-secondary'
  }
}

export default function PreQualificationRequests({ loading, data, meta, page, onPageChange }: PreQualificationRequestsProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const handleViewDetails = (id: number) => {
    setSelectedRequestId(id)
    setDetailsModalOpen(true)
  }

  return (
    <>
      <section className="ma-card" aria-labelledby="ma-prequal-title">
        <header className="ma-card-head">
          <span className="ma-card-icon" aria-hidden="true"><i className="ri-file-list-3-line"></i></span>
          <div className="min-w-0">
            <h5 id="ma-prequal-title" className="ma-card-title">Prequalification Requests</h5>
            <p className="ma-card-subtitle">What you asked for, and what we found you qualify for</p>
          </div>
          {!loading && meta && <span className="ma-card-count">{meta.total} total</span>}
        </header>

        <div className="ma-card-body">
          {!loading && data.length === 0 ? (
            <div className="ma-empty">
              <span className="ma-empty-icon" aria-hidden="true"><i className="ri-file-search-line"></i></span>
              <p className="ma-empty-title">No prequalification requests yet</p>
              <p className="ma-empty-text">Answer a few questions about your business to see which funding you may qualify for.</p>
              <Link to="/pre-qualification" className="ma-action ma-action-primary">Start a prequalification</Link>
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
                {loading ? (
                  <TableRowsLoader rows={3} columns={6} />
                ) : (
                  data.map((r) => (
                    // The whole row opens the details; its title is the button for the keyboard.
                    <tr key={r.id} className="ma-row-link" onClick={() => handleViewDetails(r.id)}>
                      <td data-label="Funding Type">
                        <button type="button" className="ma-row-title" onClick={(e) => { e.stopPropagation(); handleViewDetails(r.id) }}>
                          {r.funding_type}
                        </button>
                      </td>
                      <td data-label="Business Name" className="ma-cell-strong">{r.business_name}</td>
                      <td data-label="Industry">{r.industry}</td>
                      <td data-label="Date" className="ma-nowrap">{r.date}</td>
                      <td data-label="Requested Amount"><span className="ma-amount">{r.requested_amount}</span></td>
                      <td data-label="Status"><span className={statusClass(r.status)}>{r.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {!loading && <SectionPagination meta={meta} page={page} onPageChange={onPageChange} label="Prequalification requests" />}
      </section>

      <PreQualificationDetailsModal
        isOpen={detailsModalOpen}
        toggle={() => setDetailsModalOpen((open) => !open)}
        requestId={selectedRequestId}
      />
    </>
  )
}
