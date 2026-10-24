import SsnInput from '../../../components/SsnInput/SsnInput'

interface SsnFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string[] | string
}

/**
 * The borrower's full Social Security Number on the Personal Info tab: shown
 * masked, editable on a click, in full on the eye button. An account holding
 * only the last four digits finds it empty, to be filled in.
 */
export default function SsnField({ value, onChange, error }: SsnFieldProps) {
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
