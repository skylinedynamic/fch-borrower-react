import { useState } from 'react'
import { formatSSN, maskSSN, unformatSSN } from '../../utils/formatters'
import { SSN_DIGITS } from '../../utils/validators'

interface SsnInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}

/**
 * A full Social Security Number input, written XXX-XX-XXXX as it is typed.
 *
 * A complete number shows masked (***-**-1234) and read-only, so clicking the
 * field leaves it alone. The eye button shows it in full - and editable, which
 * is how a number on file is changed - and masks it again.
 */
export default function SsnInput({ id, value, onChange, invalid }: SsnInputProps) {
  const [visible, setVisible] = useState(false)
  // Set while the borrower is typing, so the number does not turn into a mask
  // under their fingers on the ninth digit; it masks once they leave the field.
  const [typing, setTyping] = useState(false)
  const complete = unformatSSN(value).length === SSN_DIGITS
  const masked = complete && !visible && !typing

  return (
    <div className="input-group">
      <input
        id={id}
        type={masked || visible ? 'text' : 'password'}
        className={`form-control${invalid ? ' is-invalid' : ''}`}
        placeholder="XXX-XX-XXXX"
        value={masked ? maskSSN(value) : value}
        readOnly={masked}
        onBlur={() => setTyping(false)}
        onChange={(e) => {
          setTyping(true)
          onChange(formatSSN(e.target.value))
        }}
        maxLength={11}
        inputMode="numeric"
        autoComplete="off"
      />
      <button
        type="button"
        className="btn"
        style={{ border: '1px solid #ced4da', background: '#fff', color: '#6c757d', boxShadow: 'none' }}
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        aria-label={visible ? 'Hide SSN' : 'Show SSN'}
        title={visible ? 'Hide SSN' : 'Show SSN'}
      >
        <i className={visible ? 'ri-eye-close-line' : 'ri-eye-2-line'}></i>
      </button>
    </div>
  )
}
