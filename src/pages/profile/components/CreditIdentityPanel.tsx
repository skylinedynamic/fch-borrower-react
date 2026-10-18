import { useState } from 'react'
import type { CreditProfile } from '../../../modules/credit-profile'
import { formatDate, maskSSN } from '../../../utils/formatters'

interface Props {
  personalInfo: CreditProfile['personal_info']
  addresses: CreditProfile['addresses']
}

/**
 * What the bureau holds on file about the borrower.
 *
 * Name, contact, current address and previous addresses were four separate
 * cards taking up half the page ABOVE the figures a borrower opens this tab to
 * read. It is verification data - worth being able to check, not worth being
 * read first - so it is one panel, and it starts closed.
 *
 * The SSN is masked here as well as by the API. This is a screen a borrower may
 * well have open while someone else is looking at it, and the masking should
 * not depend on the API having remembered to do it. It is the borrower's own
 * number, so revealing it stays available - behind a deliberate click, and only
 * once the panel itself has been opened. Collapsed, the digits are not in the
 * document at all.
 */

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="col-sm-6 col-lg-4">
      <div className="py-2">
        <div className="text-muted fs-12">{label}</div>
        <div className="fw-semibold text-dark fs-14">{value || '—'}</div>
      </div>
    </div>
  )
}

function AddressLine({ address }: { address: CreditProfile['addresses'][number] }) {
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean)

  return (
    <div className="d-flex align-items-start justify-content-between gap-3 py-2 border-bottom border-light">
      <span className="text-dark fs-14">{parts.join(', ')}</span>
      {address.date_reported && (
        <span className="text-muted fs-12 flex-shrink-0">
          Reported {formatDate(address.date_reported)}
        </span>
      )}
    </div>
  )
}

function SsnDetail({ ssn }: { ssn: string | null | undefined }) {
  const [revealed, setRevealed] = useState(false)

  if (!ssn) {
    return <Detail label="SSN" value={null} />
  }

  // Just the last four digits (an older account, or a bureau that reports it
  // masked): the mask already shows all there is, so nothing to reveal.
  if (ssn.replace(/\D/g, '').length <= 4) {
    return <Detail label="SSN" value={maskSSN(ssn)} />
  }

  return (
    <div className="col-sm-6 col-lg-4">
      <div className="py-2">
        <div className="text-muted fs-12">SSN</div>
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-dark fs-14">{revealed ? ssn : maskSSN(ssn)}</span>
          <button
            type="button"
            className="btn btn-link p-0 fs-12 text-decoration-none"
            onClick={() => setRevealed((wasRevealed) => !wasRevealed)}
          >
            {revealed ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreditIdentityPanel({ personalInfo, addresses }: Props) {
  const [open, setOpen] = useState(false)

  const current = addresses?.find((a) => a.type === 'CURRENT')
  const previous = addresses?.filter((a) => a.type !== 'CURRENT') ?? []

  return (
    <div className="card border shadow-sm mb-2">
      <button
        type="button"
        className="card-header bg-transparent border-0 py-2 w-100 text-start d-flex align-items-center gap-2"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
      >
        <div className="rounded bg-secondary-subtle p-2">
          <i className="ri-user-3-line text-secondary fs-16"></i>
        </div>
        <div>
          <div className="fw-semibold text-dark fs-14">Identity on file</div>
          <div className="text-muted fs-12">Name, contact details and address history</div>
        </div>
        <i className={`ms-auto fs-18 text-muted ${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
      </button>

      {open && (
        <div className="card-body px-3 pt-0 pb-2 border-top">
          <div className="row g-0 mb-2">
            <Detail label="Full name" value={personalInfo?.name} />
            <Detail
              label="Date of birth"
              value={personalInfo?.dob ? formatDate(personalInfo.dob) : null}
            />
            <SsnDetail ssn={personalInfo?.ssn} />
            <Detail
              label="Email"
              value={
                personalInfo?.email ? (
                  <a href={`mailto:${personalInfo.email}`} className="text-primary text-decoration-none">
                    {personalInfo.email}
                  </a>
                ) : null
              }
            />
            <Detail
              label="Phone"
              value={
                personalInfo?.phone ? (
                  <a href={`tel:${personalInfo.phone}`} className="text-dark text-decoration-none">
                    {personalInfo.phone}
                  </a>
                ) : null
              }
            />
          </div>

          {current && (
            <div className="mt-3">
              <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">Current address</div>
              <AddressLine address={current} />
            </div>
          )}

          {previous.length > 0 && (
            <div className="mt-3">
              <div className="text-muted fs-12 text-uppercase fw-semibold mb-1">
                Previous addresses
              </div>
              {previous.map((address, index) => (
                <AddressLine key={`${address.street}-${index}`} address={address} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
