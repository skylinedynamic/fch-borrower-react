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
 * It then showed four bureau scores as equal tiles, and only one of them was
 * ever filled. The credit pull is iSoftpull, a consumer product, so its report
 * carries no business-bureau figures at all: Experian Intelliscore and Equifax
 * parsed to null on every pull, and nothing in the platform read either one - no
 * lender rule, no readiness score, not even the admin panel. Two permanently
 * empty tiles on a credit screen do not read as "not applicable"; they read as
 * "your data failed to load". They are gone from the screen. The columns and API
 * fields stay, ready for a business-bureau integration that has not happened.
 *
 * What is left is deliberately not two equal halves:
 *
 *   FICO      - from the pull, and what six separate decisions run on (capital
 *               access, readiness, credit builder, lender min_fico, funding,
 *               dashboard). It leads.
 *   Paydex    - NOT from the pull. It is typed in by hand on the admin side
 *               ("Business Credit Scores (D&B PAYDEX)") and it decides a
 *               lender's min_business_credit_score. Shown in the same row as
 *               FICO it looked equally bureau-verified, which is worse than an
 *               empty tile: an empty tile at least asserts nothing. So it sits
 *               below, smaller, and says where it came from.
 *
 * The scale is drawn as its five named bands rather than one filled bar, with a
 * marker where the borrower sits. A bar says "you are 70% along something"; the
 * bands say which one they are in and what the next one would take - and 777
 * means nothing to a borrower who does not already know the FICO scale.
 *
 * Styling is the app's own `--ca-*` metric-card and slider vocabulary, in
 * assets/css/custom.css alongside it, not a palette of this page's own.
 */

const FICO_MIN = 300
const FICO_MAX = 850
const BUSINESS_MIN = 0
const BUSINESS_MAX = 100

/**
 * FICO's published bands, low to high. `from` is inclusive.
 *
 * The colour is part of the table rather than derived from a percentage, so the
 * word and the colour cannot disagree - a 670 that reads "Good" is never drawn
 * in the amber a percentage threshold would have given it.
 */
const FICO_BANDS = [
  { from: FICO_MIN, to: 579, name: 'Poor', slug: 'poor', fill: '#f06548' },
  { from: 580, to: 669, name: 'Fair', slug: 'fair', fill: '#e49b0f' },
  { from: 670, to: 739, name: 'Good', slug: 'good', fill: '#65a30d' },
  { from: 740, to: 799, name: 'Very Good', slug: 'very-good', fill: '#10b981' },
  { from: 800, to: FICO_MAX, name: 'Exceptional', slug: 'exceptional', fill: '#059669' },
] as const

type Band = (typeof FICO_BANDS)[number]

const BAND_NOTE: Record<string, string> = {
  Exceptional: 'Well above the US average. You should qualify for the best rates available.',
  'Very Good': 'Above the US average. Most lenders will treat this as a strong file.',
  Good: 'Around the US average. Most lenders will approve, at ordinary rates.',
  Fair: 'Below the US average. Expect a narrower set of offers and higher rates.',
  Poor: 'Well below the US average. Building this up will widen what is available to you.',
}

function bandFor(score: number): Band {
  return (
    FICO_BANDS.find((band) => score >= band.from && score <= band.to) ??
    FICO_BANDS[FICO_BANDS.length - 1]
  )
}

/** Where a value sits on its own scale, as a percentage. */
function percent(value: number, min: number, max: number): number {
  if (max <= min) return 0
  const clamped = Math.min(Math.max(value, min), max)
  return ((clamped - min) / (max - min)) * 100
}

function isPresent(value: number | null | undefined): value is number {
  return value != null && !Number.isNaN(Number(value))
}

/** Each band's share of the 300-850 range, so the segments are to scale. */
function bandWidth(band: Band): number {
  return ((band.to - band.from + 1) / (FICO_MAX - FICO_MIN + 1)) * 100
}

function Scale({ score, band }: { score: number | null; band: Band | null }) {
  return (
    <div className="cp-scale">
      <div className="cp-scale-ends">
        <span>{FICO_MIN}</span>
        <span>{FICO_MAX}</span>
      </div>

      <div className="cp-track">
        {FICO_BANDS.map((segment) => (
          <div
            key={segment.slug}
            className="cp-track-seg"
            style={{ width: `${bandWidth(segment)}%`, background: segment.fill }}
          />
        ))}

        {score != null && (
          <span
            className="cp-marker"
            style={{ left: `${percent(score, FICO_MIN, FICO_MAX)}%` }}
          />
        )}

        {/* The segments are decorative; this is what carries the score to a
            reader who is not looking at them. */}
        <div
          role="progressbar"
          aria-label="FICO"
          aria-valuenow={score ?? 0}
          aria-valuemin={FICO_MIN}
          aria-valuemax={FICO_MAX}
          aria-valuetext={band ? `${score}, ${band.name}` : 'No score reported'}
        />
      </div>

      <div className="cp-scale-bands">
        {FICO_BANDS.map((segment) => (
          <span
            key={segment.slug}
            className={`cp-scale-band${segment.slug === band?.slug ? ' is-current' : ''}`}
            style={{ width: `${bandWidth(segment)}%` }}
          >
            {segment.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="cp-figure">
      <div className="cp-label">{label}</div>
      <div className="cp-figure-value">{value}</div>
    </div>
  )
}

export default function CreditScoreHero({ metrics }: Props) {
  const ficoValue = metrics?.fico_score
  const businessValue = metrics?.paydex_score

  const hasFico = isPresent(ficoValue)
  const fico = hasFico ? Number(ficoValue) : null
  const band = fico != null ? bandFor(fico) : null
  const slug = band?.slug ?? 'unknown'

  // Nobody typed one in, so there is nothing to qualify. An empty tile here
  // would invite the same "my data is missing" reading the dead bureau tiles
  // caused, for a figure that was never going to arrive on its own.
  const hasBusiness = isPresent(businessValue)
  const business = hasBusiness ? Number(businessValue) : null

  const utilization = metrics?.credit_utilization
  const limit = metrics?.total_credit_limit

  return (
    // Score on the left, the figures that explain it on the right (stacked
    // below on narrow screens) - see .cp-overview.
    <div className="cp-overview">
      <div className="cp-hero">
        <div className="cp-hero-top">
          <div>
            <div className="cp-label">FICO Score</div>
            <div className={`cp-score-value cp-band-${slug}`}>
              {fico ?? '—'}
              {fico != null && <span className="cp-score-max">/ {FICO_MAX}</span>}
            </div>
          </div>

          <span className={`cp-band-pill cp-pill-${slug}`} data-testid="fico-band">
            {band ? band.name : 'Not reported'}
          </span>
        </div>

        <Scale score={fico} band={band} />

        <p className="cp-note">
          {band
            ? BAND_NOTE[band.name]
            : 'No score on file yet. Request an update below and we will pull your latest report.'}
        </p>
      </div>

      <div className="cp-figures">
        <Figure label="Tradelines" value={metrics?.active_tradelines?.toString() ?? '—'} />
        <Figure
          label="Credit limit"
          value={limit != null ? `$${Number(limit).toLocaleString()}` : '—'}
        />
        <Figure label="Utilization" value={utilization != null ? `${utilization}%` : '—'} />
        <Figure label="Inquiries" value={metrics?.recent_inquiries?.toString() ?? '—'} />
      </div>

      {hasBusiness && (
        <div className="cp-selfreport">
          <div>
            <div className="cp-label">Business Credit Score</div>
            <div className="cp-selfreport-value">
              {business}
              <span className="cp-score-max">/ {BUSINESS_MAX}</span>
            </div>
          </div>

          <div className="cp-selfreport-meter">
            <span
              style={{ width: `${percent(business as number, BUSINESS_MIN, BUSINESS_MAX)}%` }}
              role="progressbar"
              aria-label="Business Credit Score"
              aria-valuenow={business as number}
              aria-valuemin={BUSINESS_MIN}
              aria-valuemax={BUSINESS_MAX}
            />
          </div>

          {/* Where the number came from, next to the number itself - a note
              further down the page is not read at the moment it matters. */}
          <span className="cp-unverified">
            <span>{`${BUSINESS_MIN}–${BUSINESS_MAX}`}</span>
            {' · self-reported, not bureau-verified'}
          </span>
        </div>
      )}
    </div>
  )
}
