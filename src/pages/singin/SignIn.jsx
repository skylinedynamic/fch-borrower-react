import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../modules/auth/services'
import Auth from '../../components/Layout/Auth'
import handshakeImg from '../../../assets/images/form-side-image.png'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [remember, setRemember] = useState(false)
  

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setPasswordError('')
    setFormError('')
    setLoading(true)

    try {
      // Call centralized auth service; rely on Laravel validation
      await login(email, password, remember)
      navigate('/')
    } catch (err) {
      const data = err?.response?.data
      const message = data?.message || ''

      // Define status keywords that should trigger a global alert instead of an inline field error
      const isStatusError = (msg) => msg && (
        msg.toLowerCase().includes('subscription') ||
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('payment') ||
        msg.toLowerCase().includes('suspended') ||
        msg.toLowerCase().includes('inactive')
      );

      if (data) {
        const errors = data?.errors
        if (errors) {
          const emailMsg = Array.isArray(errors.email) ? errors.email?.[0] : errors.email
          const passwordMsg = Array.isArray(errors.password) ? errors.password?.[0] : errors.password

          // If the email error is a status issue, treat it as a form-level error for the Alert box
          if (isStatusError(emailMsg)) {
            setEmailError(emailMsg) // Keep it for the status alert logic in JSX
            setFormError('') // Ensure we don't double up with the generic message
          } else {
            if (emailMsg) setEmailError(emailMsg)
            setFormError(message)
          }
          
          if (passwordMsg) setPasswordError(passwordMsg)
        } else {
          // Fallback for non-field specific errors
          if (isStatusError(message)) {
            setEmailError(message) // Trigger the status alert
          } else {
            setFormError(message || 'Unable to sign in.')
          }
        }
      } else {
        setFormError('Network error, please try again.')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <Auth
      colClass="col-xl-9 col-lg-9 col-md-10"
      belowCard={(
        <div className="mt-4 text-center">
          <p className="mb-0 text-white">
            Don't have an account?{' '}
            <Link className="fw-semibold text-warning text-decoration-underline" to="/signup">Sign up</Link>
          </p>
        </div>
      )}
    >
      <div className="signin-page">
      <div className="row g-2">
        <div className="col-md-6 p-4 d-flex flex-column justify-content-center">
          <div className="text-center mt-2">
          <h5 className="text-primary mb-1">Welcome Back!</h5>
          <p className="text-muted">Good to see you again.</p>
        </div>
          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="useremail" className="form-label">Email <span className="text-danger">*</span></label>
              <input
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                type="email"
                className={`form-control ${emailError && !(
                  emailError.toLowerCase().includes('subscription') ||
                  emailError.toLowerCase().includes('expired') ||
                  emailError.toLowerCase().includes('payment') ||
                  emailError.toLowerCase().includes('suspended') ||
                  emailError.toLowerCase().includes('inactive')
                ) ? 'is-invalid' : ''}`}
                id="useremail"
                placeholder="Enter email"
                required
              />
              <div className="invalid-feedback">
                {emailError && !(
                  emailError.toLowerCase().includes('subscription') ||
                  emailError.toLowerCase().includes('expired') ||
                  emailError.toLowerCase().includes('payment') ||
                  emailError.toLowerCase().includes('suspended') ||
                  emailError.toLowerCase().includes('inactive')
                ) ? emailError : 'Please enter email'}
              </div>
            </div>

            <div className="mb-3">
              <div className="float-end">
                <Link className="text-muted" to="/forgot-password">Forgot password?</Link>
              </div>
              <label className="form-label" htmlFor="password-input">Password <span className="text-danger">*</span></label>
              <div className="position-relative auth-pass-inputgroup">
                <input
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control pe-5 password-input ${passwordError ? 'is-invalid' : ''}`}
                  placeholder="Enter password"
                  id="password-input"
                  required
                />
                <button
                  className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                  type="button"
                  onClick={()=>setShowPassword(s=>!s)}
                  aria-label="Toggle password visibility"
                >
                  <i className="ri-eye-fill align-middle"></i>
                </button>
                <div className="invalid-feedback">{passwordError || 'Please enter password'}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={remember}
                  onChange={(e)=>setRemember(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
              </div>
            </div>

            <div className="mt-4">
              <button className="btn btn-success w-100" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            </div>
            
            {(emailError || formError) && (
              <div className="mt-4">
                {(
                  (emailError && (
                    emailError.toLowerCase().includes('subscription') ||
                    emailError.toLowerCase().includes('expired') ||
                    emailError.toLowerCase().includes('payment') ||
                    emailError.toLowerCase().includes('suspended') ||
                    emailError.toLowerCase().includes('inactive')
                  )) ||
                  (formError && (
                    formError.toLowerCase().includes('subscription') ||
                    formError.toLowerCase().includes('expired') ||
                    formError.toLowerCase().includes('payment') ||
                    formError.toLowerCase().includes('suspended') ||
                    formError.toLowerCase().includes('inactive')
                  ))
                ) ? (
                  <div className="alert alert-danger" role="alert">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="ri-error-warning-fill fs-16 align-middle me-2"></i>
                      </div>
                      <div className="flex-grow-1">
                        <strong>Alert:</strong>{" "}
                        { (emailError?.toLowerCase().includes('expired') || formError?.toLowerCase().includes('expired'))
                          ? "Your subscription has expired. Please contact your partner to renew your subscription."
                          : (emailError?.toLowerCase().includes('payment') || formError?.toLowerCase().includes('payment'))
                          ? "Your payment was not completed. Please contact your partner for assistance."
                          : (emailError || formError)}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Only show formError or generic message if not already handled by a field-specific alert/input feedback */
                  !emailError && !passwordError && formError && (
                    <div className="alert alert-danger text-center" role="alert">
                      {formError}
                    </div>
                  )
                )}
              </div>
            )}
          </form>
        </div>
        <div className="col-lg-6 d-none d-lg-block">
          <div className="h-100 w-100">
            <img src={handshakeImg} alt="Handshake" className="img-fluid rounded-end side-image" />
          </div>
        </div>
      </div>
      </div>
    </Auth>
  )
}
