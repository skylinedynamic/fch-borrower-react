import React from 'react'

interface DashboardCardProps {
  /** Hook for tests and analytics: `data-widget="..."`. */
  widget: string
  title: string
  icon?: string
  /** Header icon tile colour (a fixed palette; only buttons follow the brand). */
  tone?: 'indigo' | 'success' | 'warning' | 'info' | 'danger' | 'violet'
  subtitle?: string
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}

/** The shell every dashboard panel shares: titled header, optional action, body. */
export default function DashboardCard({
  widget,
  title,
  icon,
  tone = 'indigo',
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  children,
}: DashboardCardProps) {
  const headingId = `db-${widget}-title`
  return (
    <section className={`db-card ${className}`} data-widget={widget} aria-labelledby={headingId}>
      <header className="db-card-header">
        {icon && (
          <span className={`db-card-icon tone-${tone}`} aria-hidden="true">
            <i className={icon}></i>
          </span>
        )}
        <div className="db-card-heading">
          <h2 id={headingId} className="db-card-title">
            {title}
          </h2>
          {subtitle && <p className="db-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="db-card-action">{action}</div>}
      </header>
      <div className={`db-card-body ${bodyClassName}`}>{children}</div>
    </section>
  )
}

interface ViewAllButtonProps {
  onClick: () => void
  label?: string
}

export function ViewAllButton({ onClick, label = 'View All' }: ViewAllButtonProps) {
  return (
    <button type="button" className="db-link-btn" onClick={onClick}>
      {label}
      <i className="ri-arrow-right-line" aria-hidden="true"></i>
    </button>
  )
}

interface EmptyStateProps {
  icon: string
  title: string
  message: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="db-empty">
      <span className="db-empty-icon" aria-hidden="true">
        <i className={icon}></i>
      </span>
      <h3 className="db-empty-title">{title}</h3>
      <p className="db-empty-text">{message}</p>
      {action}
    </div>
  )
}

/** Status pill; `tone` is a Bootstrap contextual colour (success, warning, ...). */
export function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`db-pill bg-${tone}-subtle text-${tone}`}>{children}</span>
}
