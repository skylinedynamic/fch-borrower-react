import React from 'react'

interface DetailSectionProps {
  title: string
  icon: string
  children: React.ReactNode
  /** Extra content beside the title, e.g. a count. */
  aside?: React.ReactNode
}

/** A titled card of label/value fields on the application detail views. */
export default function DetailSection({ title, icon, children, aside }: DetailSectionProps) {
  const id = `ma-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className="ma-card ma-detail-section" aria-labelledby={id}>
      <header className="ma-card-head">
        <span className="ma-card-icon" aria-hidden="true"><i className={icon}></i></span>
        <h5 id={id} className="ma-card-title">{title}</h5>
        {aside}
      </header>
      <dl className="ma-fields">{children}</dl>
    </section>
  )
}

interface FieldProps {
  label: string
  value: React.ReactNode
  /** Spans the whole row - for long text such as a purpose or a note. */
  wide?: boolean
}

/** One label and its value; an empty value reads "Not provided". */
export function Field({ label, value, wide = false }: FieldProps) {
  const empty = value === null || value === undefined || value === ''

  return (
    <div className={`ma-field ${wide ? 'is-wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{empty ? <span className="ma-field-empty">Not provided</span> : value}</dd>
    </div>
  )
}
