import React, { useId, useState } from 'react'
import type { CreditAccount } from '../../../../modules/credit-accounts'
import {
  CREDIT_ACCOUNT_NO_STATUS_LABEL,
  type CreditAccountStatus,
} from '../../../../config/creditAccountStatusOptions'
import {
  creditAccountLogo,
  issuerInitials,
  pgRequiredLabel,
  requirementLabel,
  timeInBusinessLabel,
} from '../../../../utils/creditAccounts'
import StatusMenu from './StatusMenu'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface CreditAccountCardProps {
  account: CreditAccount
  updating?: boolean
  onMark: (id: number, status: CreditAccountStatus) => void
}

const toneClass = (value: string | null | undefined) =>
  (value || 'none').toLowerCase().replace(/[^a-z0-9]+/g, '-')

/**
 * One credit account, in the card's original layout: the card image on top
 * with the Mark-as menu, the issuer and name, the category, Min FICO and TIB
 * tiles, the requirements, and Apply Now.
 */
export default function CreditAccountCard({ account, updating, onMark }: CreditAccountCardProps) {
  const titleId = useId()
  const status = account.status ?? null
  const logo = creditAccountLogo(account.image_url, API_BASE_URL)
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <article className="ca-card" aria-labelledby={titleId}>
      <div className="ca-card-visual">
        {account.approval_level && (
          <span className={`ca-level ca-level-${toneClass(account.approval_level)}`}>
            {account.approval_level}
          </span>
        )}
        <StatusMenu
          accountName={account.card_name}
          current={status}
          disabled={updating}
          onPick={(next) => onMark(account.id, next)}
        />
        {logo && !logoFailed ? (
          <img src={logo} alt="" loading="lazy" className="ca-card-image" onError={() => setLogoFailed(true)} />
        ) : (
          <span className="ca-monogram" aria-hidden="true">{issuerInitials(account.issuer)}</span>
        )}
      </div>

      <div className="ca-card-body">
        <span className="ca-issuer">{account.issuer}</span>
        <h3 id={titleId} className="ca-card-title" title={account.card_name}>{account.card_name}</h3>

        <div className="ca-card-tags">
          {account.credit_category && <span className="ca-category">{account.credit_category}</span>}
          <span className={`ca-status ca-tone-${toneClass(status)}`} data-testid="ca-status">
            <span className="ca-dot" aria-hidden="true"></span>
            {status ?? CREDIT_ACCOUNT_NO_STATUS_LABEL}
          </span>
        </div>

        <div className="ca-metrics">
          <div className="ca-metric ca-metric-fico">
            <span className="ca-metric-label"><i className="ri-user-star-line" aria-hidden="true"></i> Min FICO</span>
            <strong>{account.typical_personal_fico_min || 'No min'}</strong>
          </div>
          <div className="ca-metric ca-metric-tib">
            <span className="ca-metric-label"><i className="ri-calendar-line" aria-hidden="true"></i> TIB</span>
            <strong>{timeInBusinessLabel(account.time_in_business_min_months)}</strong>
          </div>
        </div>

        <dl className="ca-reqs">
          <div>
            <dt><i className="ri-shield-user-line ca-ico-pg" aria-hidden="true"></i> PG Required</dt>
            <dd>{pgRequiredLabel(account.personal_guarantee)}</dd>
          </div>
          <div>
            <dt><i className="ri-briefcase-4-line ca-ico-profile" aria-hidden="true"></i> Credit Profile</dt>
            <dd>{requirementLabel(account.business_credit_profile)}</dd>
          </div>
          <div>
            <dt><i className="ri-checkbox-circle-line ca-ico-final" aria-hidden="true"></i> Final Approval</dt>
            <dd>{requirementLabel(account.final_approval)}</dd>
          </div>
        </dl>

        <a
          href={account.reference_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ca-btn ca-btn-primary ca-card-apply"
        >
          Apply Now <i className="ri-arrow-right-up-line" aria-hidden="true"></i>
          <span className="visually-hidden"> (opens the vendor's site)</span>
        </a>
      </div>
    </article>
  )
}
