import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../lib/auth'
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

    if (data) {
      // Laravel validation format: { status:false, message, errors: { email: string|array, password: string|array } }
      const errors = data?.errors
      if (errors) {
        const emailMsg = Array.isArray(errors.email) ? errors.email?.[0] : errors.email
        const passwordMsg = Array.isArray(errors.password) ? errors.password?.[0] : errors.password
        if (emailMsg) setEmailError(emailMsg)
        if (passwordMsg) setPasswordError(passwordMsg)
        setFormError(data?.message ?? '')
      } else {
        // Fallback to field/message format if API returns a different shape
        if (data?.field === 'email') setEmailError(data?.message ?? '')
        if (data?.field === 'password') setPasswordError(data?.message ?? '')
        setFormError(data?.message ?? 'Unable to sign in.')
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
                className={`form-control ${emailError ? 'is-invalid' : ''}`}
                id="useremail"
                placeholder="Enter email"
                required
              />
              <div className="invalid-feedback">
                {emailError || 'Please enter email'}
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
              <button className="btn w-100 primary-btn" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            </div>

            <div className="border-top my-3"></div>
            <div className="text-center mb-3">
              <span className="text-muted">Sign In with</span>
            </div>
            <div className="d-flex justify-content-center gap-2">
              <a href="#" aria-label="Facebook" className="btn social-btn social-facebook"><i className="ri-facebook-fill"></i></a>
              <a href="#" aria-label="Google" className="btn social-btn social-google"><i className="ri-google-fill"></i></a>
              <a href="#" aria-label="GitHub" className="btn social-btn social-github"><i className="ri-github-fill"></i></a>
            </div>
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
