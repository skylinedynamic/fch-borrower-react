import React, { useEffect, useRef, useState } from 'react'
import {
  creditAccountStatusOptions,
  type CreditAccountStatus,
} from '../../../../config/creditAccountStatusOptions'

interface StatusMenuProps {
  accountName: string
  current?: CreditAccountStatus | null
  disabled?: boolean
  onPick: (status: CreditAccountStatus) => void
}

/**
 * The card's "Mark as" menu: the borrower notes where their application with
 * the vendor stands.
 *
 * BY DESIGN (BUG-028, R2-CP-CBA-01): every status is offered whatever the
 * current one is, N/A straight to Approved included. The vendor approves the
 * account outside the portal; this is the borrower's own tracking, so there is
 * no Requested -> Processing -> Approved order to enforce. Not a defect.
 */
export default function StatusMenu({ accountName, current, disabled, onPick }: StatusMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (status: CreditAccountStatus) => {
    setOpen(false)
    onPick(status)
  }

  return (
    <div className="ca-menu" ref={rootRef}>
      <button
        type="button"
        className="ca-menu-toggle"
        aria-label={`Mark status for ${accountName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <i className={disabled ? 'ri-loader-4-line ca-spin' : 'ri-more-2-fill'} aria-hidden="true"></i>
      </button>

      {open && (
        <div className="ca-menu-list" role="menu" aria-label="Mark as">
          <span className="ca-menu-head" aria-hidden="true">Mark as</span>
          {creditAccountStatusOptions.map((opt) => {
            const checked = current === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                className={`ca-menu-item${checked ? ' is-current' : ''}`}
                onClick={() => pick(opt.id)}
              >
                <span className={`ca-dot ca-tone-${opt.id.toLowerCase()}`} aria-hidden="true"></span>
                {opt.name}
                {checked && <i className="ri-check-line ca-menu-check" aria-hidden="true"></i>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
