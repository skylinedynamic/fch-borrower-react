import SsnInput from '../../../components/SsnInput/SsnInput'

interface SsnFieldProps {
  value: string
  onChange: (value: string) => void
  /** Only the last four digits are on file (accounts from before the full SSN was collected). */
  lastFourOnly: boolean
  error?: string[] | string
}

/**
 * The borrower's full Social Security Number on the Personal Info tab: shown
 * masked, in full on the eye button. Accounts holding only the last four
 * digits are asked for the whole number.
 */
export default function SsnField({ value, onChange, lastFourOnly, error }: SsnFieldProps) {
  const message = Array.isArray(error) ? error[0] : error

  return (
    <div className="col-md-6">
      <label className="form-label" htmlFor="profile-ssn">
        Social Security Number <span className="text-danger">*</span>
      </label>
      <SsnInput id="profile-ssn" value={value} onChange={onChange} invalid={!!message} />
      {message && <div className="invalid-feedback d-block">{message}</div>}
    </div>
  )
}
