import type { CreditProfile } from '../../../modules/credit-profile'

interface Props {
  metrics: CreditProfile['metrics']
}

/**
 * The negative marks on a borrower's file.
 *
 * This sat sixth on the page, in a card of grey label/value rows identical to
 * the two accounts-analysis cards either side of it - so "Collections: 3" was
 * drawn exactly like "Closed Accounts: 3". The one figure on this tab that
 * should stop a borrower reading carried no more weight than a tally, and a
 * clean file and a damaged one looked the same.
 *
 * They are different messages, so they are allowed to look different. A clean
 * file is stated once, plainly, instead of as three zeroes to be added up. A
 * mark above zero is called out, and only that mark - a borrower with one
 * collection and no public records should see which of the three it is without
 * reading all of them.
 *
 * Absent is not zero. A pull that reported nothing leaves an unknown file, not
 * a clean one, and telling a borrower they have no negative marks on that basis
 * would be a claim the data does not support.
 */

interface Mark {
  key: string
  label: string
  value: number | null | undefined
  icon: string
}

function isPresent(value: number | null | undefined): value is number {
  return value != null && !Number.isNaN(Number(value))
}

function MarkFigure({ mark }: { mark: Mark }) {
  const has = isPresent(mark.value)
  const flagged = has && Number(mark.value) > 0
  const state = flagged ? 'flagged' : has ? 'clear' : 'unknown'

  return (
    <div className="cp-health-mark">
      <div className="cp-label d-flex align-items-center gap-1">
        <i className={`${mark.icon} fs-13`}></i>
        <span>{mark.label}</span>
      </div>
      <div
        data-testid={`health-${mark.key}`}
        className={`cp-health-value is-${state} ${flagged ? 'text-danger' : ''}`}
      >
        {has ? Number(mark.value) : '—'}
      </div>
    </div>
  )
}

export default function CreditAccountHealth({ metrics }: Props) {
  const marks: Mark[] = [
    {
      key: 'delinquent',
      label: 'Delinquent',
      value: metrics?.delinquent_accounts,
      icon: 'ri-error-warning-line',
    },
    {
      key: 'public-records',
      label: 'Public records',
      value: metrics?.public_records,
      icon: 'ri-file-text-line',
    },
    {
      key: 'collections',
      label: 'Collections',
      value: metrics?.collections,
      icon: 'ri-bank-line',
    },
  ]

  const reported = marks.filter((mark) => isPresent(mark.value))
  const flagged = reported.filter((mark) => Number(mark.value) > 0)

  // Only when every one of the three came back, and every one came back zero.
  // Two zeroes and a blank is not a clean file.
  const clean = reported.length === marks.length && flagged.length === 0

  const delinquencies = metrics?.delinquencies_30_60_90

  return (
    <div className="card border shadow-sm mb-2">
      <div className="card-header bg-transparent border-bottom py-2">
        <div className="d-flex align-items-center gap-2">
          <div className={`rounded p-2 ${flagged.length ? 'bg-danger-subtle' : 'bg-success-subtle'}`}>
            <i
              className={`fs-16 ${
                flagged.length ? 'ri-alert-line text-danger' : 'ri-shield-check-line text-success'
              }`}
            ></i>
          </div>
          <div>
            <div className="fw-semibold text-dark fs-14">Account Health</div>
            <div className="text-muted fs-12">Delinquencies, public records and collections</div>
          </div>
        </div>
      </div>

      <div className="card-body px-3 py-2">
        {clean && (
          <div className="cp-clean-banner">
            <i className="ri-checkbox-circle-fill"></i>
            <span>No negative marks on file.</span>
          </div>
        )}

        <div className="cp-health">
          {marks.map((mark) => (
            <MarkFigure key={mark.key} mark={mark} />
          ))}
        </div>

        {/* On the payload since the credit profile shipped, and rendered
            nowhere until now. */}
        {delinquencies && (
          <div className="border-top mt-3 pt-3 d-flex align-items-center justify-content-between">
            <span className="text-muted fs-12">Late payments (30/60/90 days)</span>
            <span className="fw-semibold text-dark fs-14">{delinquencies}</span>
          </div>
        )}
      </div>
    </div>
  )
}
