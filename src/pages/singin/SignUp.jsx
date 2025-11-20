import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Auth from '../../components/Layout/Auth'

export default function SignUp() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [countryCode, setCountryCode] = useState('USA (+1)')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [signUpId, setSignUpId] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const rules = useMemo(() => {
    const hasLength = password.length >= 8
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return { hasLength, hasLower, hasUpper, hasNumber }
  }, [password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!agree) return
    setLoading(true)
    try {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Auth
      header={(<div className="text-center mt-2"><h5 className="text-primary pb-4 font-weight-bolder">Get Started Now</h5></div>)}
      colClass="col-xl-7 col-lg-7 col-md-7"
      bodyClass="p-4"
      belowCard={(
        <div className="mt-4 text-center">
          <p className="mb-0 text-white">Already have an account?{' '}<Link className="fw-semibold text-warning text-decoration-underline" to="/login">Sign in</Link></p>
        </div>
      )}
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="first-name">First Name <span className="text-danger">*</span></label>
            <input id="first-name" type="text" className={`form-control ${errors?.first_name ? 'is-invalid' : ''}`} placeholder="Enter first name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
            {errors?.first_name && (<div className="invalid-feedback">{String(errors.first_name)}</div>)}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="last-name">Last Name <span className="text-danger">*</span></label>
            <input id="last-name" type="text" className={`form-control ${errors?.last_name ? 'is-invalid' : ''}`} placeholder="Enter last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
            {errors?.last_name && (<div className="invalid-feedback">{String(errors.last_name)}</div>)}
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="state-select">State <span className="text-danger">*</span></label>
            <select id="state-select" className={`form-select ${errors?.state ? 'is-invalid' : ''}`} value={stateVal} onChange={(e)=>setStateVal(e.target.value)} required>
              <option value="">Select state</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
            </select>
            {errors?.state && (<div className="invalid-feedback">{String(errors.state)}</div>)}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="phone-number">Phone Number <span className="text-danger">*</span></label>
            <div className="d-flex gap-2">
              <select className="form-select w-auto" value={countryCode} onChange={(e)=>setCountryCode(e.target.value)}>
                <option>USA (+1)</option>
                <option>CAN (+1)</option>
                <option>UK (+44)</option>
              </select>
              <input id="phone-number" type="tel" className={`form-control ${errors?.phone ? 'is-invalid' : ''}`} placeholder="Enter number" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required />
            </div>
            {errors?.phone && (<div className="invalid-feedback d-block">{String(errors.phone)}</div>)}
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="email">Email Address <span className="text-danger">*</span></label>
            <input id="email" type="email" className={`form-control ${errors?.email ? 'is-invalid' : ''}`} placeholder="Enter email id" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            {errors?.email && (<div className="invalid-feedback">{String(errors.email)}</div>)}
          </div>
              <div className="col-md-6">
            <label className="form-label" htmlFor="signup-id">Sign Up Id <span className="text-danger">*</span></label>
            <input id="signup-id" type="text" className={`form-control ${errors?.signup_id ? 'is-invalid' : ''}`} placeholder="Enter sign up id" value={signUpId} onChange={(e)=>setSignUpId(e.target.value)} required />
            {errors?.signup_id && (<div className="invalid-feedback">{String(errors.signup_id)}</div>)}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="password-input">Password <span className="text-danger">*</span></label>
            <div className="position-relative auth-pass-inputgroup">
              <input id="password-input" type={showPassword ? 'text' : 'password'} className={`form-control pe-5 ${errors?.password ? 'is-invalid' : ''}`} placeholder="Enter password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              <button type="button" className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon material-shadow-none" onClick={()=>setShowPassword((s)=>!s)}><i className="ri-eye-fill align-middle"></i></button>
              {errors?.password && (<div className="invalid-feedback">{String(errors.password)}</div>)}
            </div>
            <div className="fs-12 text-muted mt-1">Choose a strong password (8+ chars, upper, lower, number, special char)</div>
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="confirm-password-input">Confirm Password <span className="text-danger">*</span></label>
            <div className="position-relative auth-pass-inputgroup">
              <input id="confirm-password-input" type={showConfirm ? 'text' : 'password'} className={`form-control pe-5 ${errors?.confirm_password ? 'is-invalid' : ''}`} placeholder="Confirm password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
              <button type="button" className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon material-shadow-none" onClick={()=>setShowConfirm((s)=>!s)}><i className="ri-eye-fill align-middle"></i></button>
              {(errors?.confirm_password || (password && confirmPassword && password !== confirmPassword)) && (
                <div className="invalid-feedback d-block">{errors?.confirm_password ? String(errors.confirm_password) : 'Passwords do not match'}</div>
              )}
            </div>
          </div>

      

          <div className="col-12">
            <div className="form-check">
              <input id="agree" type="checkbox" className="form-check-input" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
              <label className="form-check-label" htmlFor="agree">I agree to the <Link to="/under-construction/terms" className="text-warning">Terms & conditions</Link></label>
            </div>
          </div>

          <div className="col-12 mt-2">
            <button type="submit" className="btn w-100" disabled={!agree || loading} style={{background:'#0b2a4a',borderColor:'#0b2a4a',color:'#fff'}}>{loading ? 'Signing up...' : 'Sign up'}</button>
          </div>
        </div>

        {/* <div id="password-contain" className="p-3 bg-light mt-3 rounded d-block">
          <h5 className="fs-13">Password must contain:</h5>
          <p className={`${rules.hasLength ? 'valid' : 'invalid'} fs-12 mb-2`}>Minimum <b>8 characters</b></p>
          <p className={`${rules.hasLower ? 'valid' : 'invalid'} fs-12 mb-2`}>At <b>least 1 lowercase</b> letter (a-z)</p>
          <p className={`${rules.hasUpper ? 'valid' : 'invalid'} fs-12 mb-2`}>At least <b>1 uppercase</b> letter (A-Z)</p>
          <p className={`${rules.hasNumber ? 'valid' : 'invalid'} fs-12 mb-0`}>At least <b>1 number</b> (0-9)</p>
        </div> */}
      </form>
    </Auth>
  )
}
