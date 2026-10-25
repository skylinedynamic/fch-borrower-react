import React from 'react'
import DashboardCard, { EmptyState, StatusPill, ViewAllButton } from './DashboardCard'

export interface ApplicationColumn<Row> {
  header: string
  render: (row: Row) => React.ReactNode
  /** The first column reads as the row's name. */
  primary?: boolean
  align?: 'end'
  /** Keep on one line (dates). */
  nowrap?: boolean
}

interface ApplicationsTableProps<Row extends { id: number; status: string; status_class: string }> {
  widget: string
  title: string
  icon: string
  tone?: 'indigo' | 'violet'
  rows: Row[]
  columns: ApplicationColumn<Row>[]
  emptyTitle: string
  emptyMessage: string
  onViewAll: () => void
}

/** A compact "latest N" table with a status column and a link to the full list. */
export default function ApplicationsTable<Row extends { id: number; status: string; status_class: string }>({
  widget,
  title,
  icon,
  tone = 'indigo',
  rows,
  columns,
  emptyTitle,
  emptyMessage,
  onViewAll,
}: ApplicationsTableProps<Row>) {
  return (
    <DashboardCard
      widget={widget}
      title={title}
      icon={icon}
      tone={tone}
      action={<ViewAllButton onClick={onViewAll} />}
      bodyClassName="p-0"
    >
      {rows.length > 0 ? (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.header} scope="col" className={col.align === 'end' ? 'text-end' : ''}>
                    {col.header}
                  </th>
                ))}
                <th scope="col" className="text-end">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={`${col.primary ? 'db-cell-primary' : ''} ${col.align === 'end' ? 'text-end db-num' : ''} ${col.nowrap ? 'text-nowrap' : ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  <td className="text-end">
                    <StatusPill tone={row.status_class}>{row.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={icon} title={emptyTitle} message={emptyMessage} />
      )}
    </DashboardCard>
  )
}
