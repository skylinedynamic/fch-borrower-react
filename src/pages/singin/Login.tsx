import React, { useState } from 'react'
import { Link } from 'react-router-dom'
// @ts-ignore
import Auth from '../../components/Layout/Auth'
import handshakeImg from '../../../assets/images/small/img-6.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <Auth
      header={(
        <div className="text-center mt-2">
          <h5 className="text-primary mb-1">Welcome Back!</h5>
          <p className="text-muted">Good to see you again.</p>
        </div>
      )}
      colClass="col-xl-9 col-lg-9 col-md-10"
      belowCard={(
        <div className="mt-4 text-center">
          <p className="mb-0">
            Don't have an account?{' '}
            <Link className="fw-semibold text-primary text-decoration-underline" to="/under-construction/signup">Sign up</Link>
          </p>
        </div>
      )}
    >
      <div className="row g-0">
        <div className="col-md-6 p-2">
          <form className="needs-validation" noValidate onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label">Email <span className="text-danger">*</span></label>
              <input
                id="loginEmail"
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <div className="float-end">
                <Link className="text-muted" to="/forgot-password">Forgot password?</Link>
              </div>
              <label className="form-label" htmlFor="loginPassword">Password <span className="text-danger">*</span></label>
              <div className="position-relative auth-pass-inputgroup">
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control pe-5"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                />
                <button type="button" className="btn btn-link position-absolute end-0 top-0 h-100 px-3 text-decoration-none" onClick={()=>setShowPassword((s)=>!s)} aria-label="Toggle password">
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input id="rememberMe" type="checkbox" className="form-check-input" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn btn-dark w-100">Sign in</button>
            </div>
            <div className="text-center my-3">
              <span className="text-muted">Sign In with</span>
            </div>
            <div className="d-flex justify-content-center gap-2">
              <a className="btn btn-light border" href="#" aria-label="Facebook"><i className="ri-facebook-fill"></i></a>
              <a className="btn btn-light border" href="#" aria-label="Google"><i className="ri-google-fill"></i></a>
              <a className="btn btn-light border" href="#" aria-label="GitHub"><i className="ri-github-fill"></i></a>
            </div>
          </form>
        </div>
        <div className="col-md-6">
          <div className="h-100 w-100">
            <img src={handshakeImg} alt="Handshake" className="img-fluid rounded-end" style={{objectFit:'cover', width:'100%', height:'100%'}} />
          </div>
        </div>
      </div>
    </Auth>
  )
}
