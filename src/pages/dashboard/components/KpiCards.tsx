import React from 'react'
import type { DashboardStats } from '../../../modules/dashboard/types'

interface Kpi {
  title: string
  value: string
  icon: string
  tone: 'success' | 'warning' | 'violet' | 'info'
}

const toKpis = (stats: DashboardStats): Kpi[] => [
  {
    title: 'Funding Applications',
    value: String(stats.funding_applications ?? 0),
    icon: 'ri-hand-coin-line',
    tone: 'success',
  },
  {
    title: 'Total Funding Requests',
    value: String(stats.funding_requests || 0),
    icon: 'ri-pie-chart-2-line',
    tone: 'warning',
  },
  {
    title: 'Total Requested Amount',
    // Formatted by the API: $37.2M, $45K.
    value: stats.total_requested_amount_formatted || '$0',
    icon: 'ri-wallet-3-line',
    tone: 'violet',
  },
  {
    title: 'Total Funded Amount',
    value: stats.total_funded_amount_formatted || '$0',
    icon: 'ri-money-dollar-circle-line',
    tone: 'info',
  },
]

export default function KpiCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="db-kpis">
      {toKpis(stats).map((kpi) => (
        <div className={`db-kpi tone-${kpi.tone}`} key={kpi.title} data-kpi>
          <i className={`${kpi.icon} db-kpi-watermark`} aria-hidden="true"></i>
          <div className="db-kpi-top">
            <span className="db-kpi-label">{kpi.title}</span>
            <span className="db-kpi-icon" aria-hidden="true">
              <i className={kpi.icon}></i>
            </span>
          </div>
          <div className="db-kpi-value">{kpi.value}</div>
        </div>
      ))}
    </div>
  )
}
