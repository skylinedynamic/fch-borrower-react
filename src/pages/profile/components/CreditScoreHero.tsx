import type { CreditProfile } from '../../../modules/credit-profile'

interface Props {
  metrics: CreditProfile['metrics']
}

/**
 * The scores and the handful of figures that describe them, at the top of the
 * credit profile.
 *
 * The page used to open with identity and address cards and put the scores
 * fifth, rendered as label/value rows identical to "City" and "Zip" - so the one
 * thing a borrower opens this tab to see carried no more weight than their
 * postcode. These are the numbers; they read as numbers.
 *
 * Ranges are the published ones for each bureau's scale, which is what makes a
 * bare number mean anything: 712 is good on FICO and impossible on Paydex.
 */

interface ScoreSpec {
  label: string
  value: number | null | undefined
  min: number
  max: number
  /** What the scale is, so the number is not read against the wrong one. */
  scale: string
}

/** Where a score sits on its own scale, as a percentage. */
function position(value: number, min: number, max: number): number {
  if (max <= min) return 0
  const clamped = Math.min(Math.max(value, min), max)
  return ((clamped - min) / (max - min)) * 100
}

/**
 * Colour by band, not by number: the same 600 is strong on one scale and weak on
 * another, so the fraction of the scale is what decides.
 */
function bandClass(pct: number): string {
  if (pct >= 70) return 'text-success'
  if (pct >= 40) return 'text-warning'
  return 'text-danger'
}

function barClass(pct: number): string {
  if (pct >= 70) return 'bg-success'
  if (pct >= 40) return 'bg-warning'
  return 'bg-danger'
}

function ScoreTile({ spec }: { spec: ScoreSpec }) {
  const has = spec.value != null && !Number.isNaN(Number(spec.value))
  const numeric = has ? Number(spec.value) : 0
  const pct = has ? position(numeric, spec.min, spec.max) : 0

  return (
    <div className="col-6 col-lg-3">
      <div className="border rounded-3 p-3 h-100 bg-white">
        <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">{spec.label}</div>

        <div className="d-flex align-items-baseline gap-2">
          <span className={`fw-bold lh-1 ${has ? bandClass(pct) : 'text-muted'}`} style={{ fontSize: '2rem' }}>
            {has ? numeric : '—'}
          </span>
          {has && <span className="text-muted fs-12">/ {spec.max}</span>}
        </div>

        {/* A bare number says little without its scale; the bar is that scale. */}
        <div className="progress mt-2" style={{ height: 4 }}>
          <div
            className={`progress-bar ${has ? barClass(pct) : 'bg-light'}`}
            style={{ width: `${has ? pct : 0}%` }}
            role="progressbar"
            aria-valuenow={has ? numeric : 0}
            aria-valuemin={spec.min}
            aria-valuemax={spec.max}
            aria-label={spec.label}
          />
        </div>

        <div className="text-muted fs-12 mt-1">{spec.scale}</div>
      </div>
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="px-3 py-2">
        <div className="text-muted fs-12">{label}</div>
        <div className="fw-semibold text-dark fs-15">{value}</div>
      </div>
    </div>
  )
}

export default function CreditScoreHero({ metrics }: Props) {
  const scores: ScoreSpec[] = [
    { label: 'FICO', value: metrics?.fico_score, min: 300, max: 850, scale: '300–850' },
    { label: 'Paydex', value: metrics?.paydex_score, min: 0, max: 100, scale: '0–100' },
    {
      label: 'Experian Intelliscore',
      value: metrics?.experian_intelliscore,
      min: 1,
      max: 100,
      scale: '1–100',
    },
    { label: 'Equifax', value: metrics?.equifax_score, min: 101, max: 992, scale: '101–992' },
  ]

  const utilization = metrics?.credit_utilization
  const limit = metrics?.total_credit_limit

  return (
    <div className="mb-4">
      <div className="row g-3">
        {scores.map((spec) => (
          <ScoreTile key={spec.label} spec={spec} />
        ))}
      </div>

      {/* The figures a score is usually explained by, kept together with it
          rather than in a separate card further down the page. */}
      <div className="row g-0 mt-3 border rounded-3 bg-light py-2">
        <Figure label="Active tradelines" value={metrics?.active_tradelines?.toString() ?? '—'} />
        <Figure
          label="Total credit limit"
          value={limit != null ? `$${Number(limit).toLocaleString()}` : '—'}
        />
        <Figure
          label="Credit utilization"
          value={utilization != null ? `${utilization}%` : '—'}
        />
        <Figure label="Recent inquiries" value={metrics?.recent_inquiries?.toString() ?? '—'} />
      </div>
    </div>
  )
}
