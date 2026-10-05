import type { CreditProfile } from '../../../modules/credit-profile'

interface Props {
  metrics: CreditProfile['metrics']
}

/**
 * The account figures, in one card instead of two.
 *
 * "Open Accounts Analysis" and "All Accounts Analysis" were separate cards with
 * matching headers, matching icons and ten label/value rows between them. They
 * describe the same set of accounts from two angles - what the open ones cost
 * and carry, and how many there have ever been - and split across two boxes a
 * borrower had to hold one half in their head to read the other.
 *
 * Formatting lives here rather than at each call site, where it was repeated
 * ten times as inline `$${Number(x).toLocaleString()}` expressions.
 *
 * A figure the pull did not report is dashed, never zeroed: $0 available credit
 * is a real and alarming number, and "not reported" is not that.
 */

function money(value: unknown): string {
  return value != null && !Number.isNaN(Number(value))
    ? `$${Number(value).toLocaleString()}`
    : '—'
}

function ratio(value: unknown): string {
  return value != null && !Number.isNaN(Number(value)) ? `${Number(value)}%` : '—'
}

function count(value: unknown): string {
  return value != null && !Number.isNaN(Number(value)) ? String(Number(value)) : '—'
}

function plain(value: unknown): string {
  return value ? String(value) : '—'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-light">
      <span className="text-muted fs-13">{label}</span>
      <span className="fw-semibold text-dark fs-14">{value}</span>
    </div>
  )
}

function Column({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="col-lg-6">
      <div className="px-2">
        <div className="fw-semibold text-dark fs-13 mb-1">{title}</div>
        <div className="text-muted fs-12 mb-2">{hint}</div>
        {children}
      </div>
    </div>
  )
}

export default function CreditAccountsBreakdown({ metrics }: Props) {
  const open = metrics?.open_accounts_analysis
  const all = metrics?.all_accounts_analysis

  return (
    <div className="card border shadow-sm mb-3">
      <div className="card-header bg-transparent border-bottom py-3">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded bg-primary-subtle p-2">
            <i className="ri-stack-line text-primary fs-16"></i>
          </div>
          <div>
            <div className="fw-semibold text-dark fs-14">Accounts</div>
            <div className="text-muted fs-12">What the open accounts carry, and the file as a whole</div>
          </div>
        </div>
      </div>

      <div className="card-body px-4 py-3">
        <div className="row g-3">
          <Column title="Open accounts" hint="Currently reporting">
            <Row label="Monthly payments" value={money(open?.monthly_payments)} />
            <Row label="Balance" value={money(open?.balance)} />
            <Row label="Credit limit" value={money(open?.credit_limit)} />
            <Row label="Available credit" value={money(open?.available_credit)} />
            <Row label="Utilization ratio" value={ratio(open?.utilization_ratio)} />
          </Column>

          <Column title="All accounts" hint="Open and closed, all time">
            <Row label="Total accounts" value={count(all?.total_accounts)} />
            <Row label="Open accounts" value={count(all?.open_accounts)} />
            <Row label="Closed accounts" value={count(all?.closed_accounts)} />
            <Row label="Newest opened" value={plain(all?.newest_open_date)} />
            <Row label="Oldest opened" value={plain(all?.oldest_open_date)} />
          </Column>
        </div>
      </div>
    </div>
  )
}
