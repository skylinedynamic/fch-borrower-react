import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTaskOverview } from '../../../../modules/credit-builder/overview'
import type { Task } from '../../../../modules/credit-builder/overview/types'
import TaskStatusCardsLoader from '../../../../components/Loader/TaskStatusCardsLoader'

const GUIDE_PATH = '/credit-builder/guide'

/** Rows shown before "Show all". */
const FIRST_ROWS = 6

type Status = 'rejected' | 'processing' | 'verified'
type Filter = 'all' | Status

/** In list order: what needs fixing first, then what is being reviewed, then what is done. */
const STATUSES: Record<Status, { label: string; tab: string; icon: string; empty: string }> = {
  rejected: { label: 'Needs attention', tab: 'Needs attention', icon: 'ri-error-warning-line', empty: 'Nothing needs your attention' },
  processing: { label: 'In review', tab: 'In review', icon: 'ri-loader-4-line', empty: 'No tasks in review' },
  verified: { label: 'Verified', tab: 'Verified', icon: 'ri-checkbox-circle-line', empty: 'No verified tasks yet' },
}
const ORDER: Status[] = ['rejected', 'processing', 'verified']

type Row = Task & { state: Status }

/**
 * Every task the borrower has submitted, in one list - what needs fixing
 * first, with the reason and the way back to the Guide - filtered by where it
 * stands.
 */
export default function TaskStatusCards() {
  const { data, isLoading, isError, error } = useTaskOverview()
  const [filter, setFilter] = useState<Filter>('all')
  const [showAll, setShowAll] = useState(false)

  if (isLoading) {
    return <TaskStatusCardsLoader />
  }

  if (isError) {
    return (
      <div className="co-card co-state">
        <i className="ri-error-warning-line" aria-hidden="true"></i>
        <p>{error instanceof Error ? error.message : 'Failed to load task overview'}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // A list the API leaves out is an empty one, not a broken page.
  const byStatus: Record<Status, Row[]> = {
    rejected: (data.rejected ?? []).map((t) => ({ ...t, state: 'rejected' as const })),
    processing: (data.processing ?? []).map((t) => ({ ...t, state: 'processing' as const })),
    verified: (data.verified ?? []).map((t) => ({ ...t, state: 'verified' as const })),
  }
  const total = ORDER.reduce((sum, s) => sum + byStatus[s].length, 0)
  const listed = filter === 'all' ? ORDER.flatMap((s) => byStatus[s]) : byStatus[filter]
  const visible = showAll ? listed : listed.slice(0, FIRST_ROWS)

  const choose = (next: Filter) => {
    setFilter(next)
    setShowAll(false)
  }

  return (
    <div className="co-card co-activity">
      <div className="co-card-head">
        <div>
          <h2 className="co-card-title">Task activity</h2>
          <p className="co-card-sub">Every task you have submitted, by where it stands</p>
        </div>
        {total > 0 && (
          <div className="co-tabs" role="tablist" aria-label="Filter tasks">
            {(['all', ...ORDER] as Filter[]).map((f) => {
              const count = f === 'all' ? total : byStatus[f].length

              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  className={`co-tab is-${f} ${filter === f ? 'is-active' : ''}`}
                  onClick={() => choose(f)}
                >
                  {f === 'all' ? 'All' : STATUSES[f].tab}
                  <span className="co-tab-count">{count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {total === 0 ? (
        <div className="co-activity-empty">
          <span className="co-activity-empty-icon" aria-hidden="true">
            <i className="ri-rocket-2-line"></i>
          </span>
          <h3>No tasks submitted yet</h3>
          <p>Complete your first task in the Step-By-Step Guide and it will show here.</p>
          <Link to={GUIDE_PATH} className="co-btn co-btn-primary">
            Start in the guide <i className="ri-arrow-right-line" aria-hidden="true"></i>
          </Link>
        </div>
      ) : (
        <>
          <div className="co-dist" aria-hidden="true">
            {ORDER.map((s) =>
              byStatus[s].length > 0 ? (
                <span key={s} className={`co-dist-seg is-${s}`} style={{ flexGrow: byStatus[s].length }}></span>
              ) : null
            )}
          </div>

          {listed.length === 0 ? (
            <div className="co-activity-none">
              <i className={filter === 'all' ? 'ri-inbox-line' : STATUSES[filter].icon} aria-hidden="true"></i>
              <span>{filter === 'all' ? 'No tasks' : STATUSES[filter].empty}</span>
            </div>
          ) : (
            <ul className="co-rows" aria-label="Tasks">
              {visible.map((row) => (
                <li key={`${row.state}-${row.id}`} className={`co-row is-${row.state}`}>
                  <span className="co-row-icon" aria-hidden="true">
                    <i className={STATUSES[row.state].icon}></i>
                  </span>
                  <div className="co-row-body">
                    <div className="co-row-top">
                      <span className="co-row-title">{row.title}</span>
                      {row.tier && <span className="co-row-tier">{row.tier}</span>}
                    </div>
                    {row.subtitle && <p className="co-row-sub">{row.subtitle}</p>}
                    {row.state === 'rejected' && row.rejection_reason && (
                      <p className="co-row-reason">
                        <i className="ri-information-line" aria-hidden="true"></i>
                        <span>{row.rejection_reason}</span>
                      </p>
                    )}
                  </div>
                  <div className="co-row-side">
                    <span className={`co-row-status is-${row.state}`}>{STATUSES[row.state].label}</span>
                    {row.state === 'verified' && row.completed_at && (
                      <span className="co-row-date">
                        <i className="ri-calendar-check-line" aria-hidden="true"></i> {row.completed_at}
                      </span>
                    )}
                    {row.state === 'rejected' && (
                      <Link to={GUIDE_PATH} className="co-row-fix">
                        Fix in the guide <i className="ri-arrow-right-line" aria-hidden="true"></i>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!showAll && listed.length > FIRST_ROWS && (
            <button type="button" className="co-more" onClick={() => setShowAll(true)}>
              Show all {listed.length}
            </button>
          )}
        </>
      )}
    </div>
  )
}
