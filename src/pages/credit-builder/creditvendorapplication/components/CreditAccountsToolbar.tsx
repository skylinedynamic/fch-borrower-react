import React from 'react'
import CustomDropdown from '../../../../components/Common/CustomDropdown'

export interface CreditAccountsDraft {
  category: string
  issuer: string
  q: string
}

interface Option { id: string; name: string }

interface CreditAccountsToolbarProps {
  draft: CreditAccountsDraft
  categories: Option[]
  issuers: Option[]
  disabled: boolean
  onChange: (draft: CreditAccountsDraft) => void
  onApply: () => void
  onClear: () => void
}

/** Search, Category and Issuer. Enter in the search applies, as the Apply button does. */
export default function CreditAccountsToolbar({
  draft, categories, issuers, disabled, onChange, onApply, onClear,
}: CreditAccountsToolbarProps) {
  return (
    <form
      className="ca-toolbar"
      role="search"
      aria-label="Filter credit accounts"
      onSubmit={(e) => { e.preventDefault(); onApply() }}
    >
      <label className="ca-search">
        <i className="ri-search-line" aria-hidden="true"></i>
        <input
          type="search"
          aria-label="Search accounts"
          placeholder="Search by account or issuer…"
          value={draft.q}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, q: e.target.value })}
        />
      </label>

      <div className="ca-select">
        <CustomDropdown
          options={categories}
          value={draft.category}
          onChange={(val) => onChange({ ...draft, category: val })}
          optionLabel="name"
          optionValue="id"
          placeholder={categories[0]?.name}
          disabled={disabled}
          className="ca-dropdown"
        />
      </div>

      <div className="ca-select">
        <CustomDropdown
          options={issuers}
          value={draft.issuer}
          onChange={(val) => onChange({ ...draft, issuer: val })}
          optionLabel="name"
          optionValue="id"
          placeholder={issuers[0]?.name}
          searchable
          disabled={disabled}
          className="ca-dropdown"
        />
      </div>

      <div className="ca-toolbar-actions">
        <button type="submit" className="ca-btn ca-btn-primary" disabled={disabled}>
          <i className="ri-equalizer-line" aria-hidden="true"></i> Apply
        </button>
        <button type="button" className="ca-btn ca-btn-ghost" disabled={disabled} onClick={onClear}>
          <i className="ri-close-line" aria-hidden="true"></i> Clear
        </button>
      </div>
    </form>
  )
}
