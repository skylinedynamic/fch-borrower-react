import React from 'react'
import type { CoBorrower } from '../../types'

type CoBorrowerTableProps = {
  coBorrowers: CoBorrower[]
  onDelete: (idx: number) => void
  onAdd: () => void
}

export default function CoBorrowerTable({ coBorrowers, onDelete, onAdd }: CoBorrowerTableProps) {
  return (
    <div className="card coborrower-card">
      <div className="card-header d-flex align-items-center">
        <span className="card-title fw-semibold">Co-Borrowers</span>
        {coBorrowers.length > 0 && (
          <button type="button" className="btn btn-primary ms-auto btn-add-coborrower" onClick={onAdd}>
            + ADD
          </button>
        )}
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table coborrower-table">
            <thead className="coborrower-thead">
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Ownership</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {coBorrowers.map((cb, idx) => (
                <tr key={`${cb.firstName}-${cb.lastName}-${idx}`} className="coborrower-row">
                  <td data-label="First Name">{cb.firstName}</td>
                  <td data-label="Last Name">{cb.lastName}</td>
                  <td data-label="Ownership">{cb.ownershipPct ? `${cb.ownershipPct}%` : ''}</td>
                  <td data-label="Action" className="text-end">
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0"
                      onClick={() => onDelete(idx)}
                      aria-label="Delete"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {coBorrowers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No co-borrowers added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
