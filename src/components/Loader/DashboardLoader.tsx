import React from 'react'
import '../../pages/dashboard/Dashboard.css'
import './DashboardLoader.css'

/**
 * Placeholder block. `w` / `h` are pixels or any CSS length; `dark` is for
 * blocks sitting on a brand-coloured surface.
 */
function Sk({ w, h, dark, round, className = '' }: { w?: number | string; h: number | string; dark?: boolean; round?: boolean; className?: string }) {
  return (
    <span
      className={`db-sk ${dark ? 'on-dark' : ''} ${round ? 'is-round' : ''} ${className}`}
      style={{ width: w ?? '100%', height: h }}
    ></span>
  )
}

function CardHead({ title, action }: { title: number; action?: boolean }) {
  return (
    <div className="db-card-header">
      <Sk w={38} h={38} />
      <div className="db-card-heading">
        <Sk w={title} h={16} />
      </div>
      {action && <Sk w={70} h={28} />}
    </div>
  )
}

function SkTable({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="db-table-wrap">
      <table className="db-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Sk w="70%" h={10} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  {c === columns - 1 ? <Sk w={72} h={22} className="ms-auto" /> : <Sk w={c === 0 ? '80%' : '60%'} h={12} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Skeleton for the borrower dashboard. It is the dashboard's own layout - the
 * same hero, KPI grid, rows and strip, built from the same classes - so nothing
 * moves when the real content replaces it.
 */
export default function DashboardLoader() {
  return (
    <div
      className="page-content dashboard-page db-page"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="container-fluid">
        {/* Hero */}
        <section className="db-hero" aria-hidden="true">
          <span className="db-hero-orb db-hero-orb-a"></span>
          <span className="db-hero-orb db-hero-orb-b"></span>

          <div className="db-hero-main">
            <Sk w={170} h={24} dark className="mb-2" />
            <Sk w="70%" h={32} dark className="mb-2" />
            <Sk w="45%" h={14} dark />
            <div className="db-hero-cta">
              <Sk w={110} h={22} dark className="mb-3" />
              <Sk w="62%" h={20} dark className="mb-2" />
              <Sk w="85%" h={14} dark className="mb-3" />
              <Sk w={160} h={42} dark />
            </div>
          </div>

          <div className="db-hero-panel">
            <div className="db-hero-panel-head">
              <Sk w={38} h={38} dark />
              <div className="flex-grow-1">
                <Sk w="45%" h={14} dark className="mb-1" />
                <Sk w="60%" h={10} dark />
              </div>
            </div>
            <div className="db-hero-panel-body">
              <Sk w={136} h={136} dark round />
              <div className="db-hero-facts flex-grow-1">
                <div>
                  <Sk w={110} h={10} dark className="mb-2" />
                  <Sk w={80} h={28} dark />
                </div>
                <div>
                  <Sk w={120} h={10} dark className="mb-2" />
                  <Sk w={150} h={30} dark />
                </div>
              </div>
            </div>
            <Sk w="85%" h={10} dark className="mt-3" />
          </div>
        </section>

        {/* KPI cards */}
        <div className="db-kpis" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="db-kpi is-skeleton" key={i}>
              <div className="db-kpi-top">
                <Sk w="55%" h={12} />
                <Sk w={42} h={42} />
              </div>
              <Sk w="45%" h={32} className="mt-3" />
            </div>
          ))}
        </div>

        {/* Credit profile, meetings, invoices */}
        <div className="row g-3 mb-3" aria-hidden="true">
          <div className="col-xl-6 d-flex db-stretch">
            <section className="db-card db-profile">
              <div className="db-profile-half">
                <div className="db-section-label">
                  <Sk w={38} h={38} />
                  <Sk w={110} h={16} />
                </div>
                <div className="db-sk-gauge">
                  <Sk w="100%" h="100%" className="db-sk-gauge-arc" />
                </div>
                <Sk w="90%" h={12} className="mx-auto mb-2" />
                <Sk w="70%" h={12} className="mx-auto" />
              </div>
              <div className="db-profile-half db-profile-tier">
                <div className="db-section-label">
                  <Sk w={38} h={38} />
                  <Sk w={140} h={16} />
                </div>
                <div className="db-profile-tier-body">
                  <div className="db-tier">
                    <Sk w={52} h={52} />
                    <div className="flex-grow-1">
                      <Sk w="50%" h={18} className="mb-2" />
                      <Sk w="75%" h={12} />
                    </div>
                  </div>
                  <Sk w="100%" h={46} />
                </div>
              </div>
            </section>
          </div>

          <div className="col-xl-3 col-md-6 d-flex db-stretch">
            <section className="db-card" data-skeleton="meetings">
              <CardHead title={130} />
              <div className="db-card-body">
                <ul className="db-meetings">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li className="db-meeting" key={i}>
                      <Sk w={40} h={36} />
                      <div className="flex-grow-1">
                        <Sk w="75%" h={13} className="mb-1" />
                        <Sk w="60%" h={11} />
                      </div>
                    </li>
                  ))}
                </ul>
                <Sk w="100%" h={40} />
              </div>
            </section>
          </div>

          <div className="col-xl-3 col-md-6 d-flex db-stretch">
            <section className="db-card" data-skeleton="invoices">
              <CardHead title={80} />
              <div className="db-card-body">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div className="db-invoice" key={i}>
                    <Sk w={32} h={32} />
                    <div className="flex-grow-1">
                      <Sk w="75%" h={12} className="mb-2" />
                      <Sk w="50%" h={12} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Applications, side by side */}
        <div className="row g-3 mb-3" aria-hidden="true">
          <div className="col-xl-6 d-flex db-stretch">
            <section className="db-card" data-skeleton="table">
              <CardHead title={200} action />
              <SkTable columns={5} rows={3} />
            </section>
          </div>
          <div className="col-xl-6 d-flex db-stretch">
            <section className="db-card" data-skeleton="table">
              <CardHead title={190} action />
              <SkTable columns={6} rows={3} />
            </section>
          </div>
        </div>

        {/* Support strip */}
        <section className="db-support" aria-hidden="true">
          <Sk w={52} h={52} dark />
          <div className="db-support-text-wrap">
            <Sk w={120} h={18} dark className="mb-2" />
            <Sk w="55%" h={12} dark />
          </div>
          <Sk w={160} h={44} dark />
        </section>
      </div>
    </div>
  )
}
