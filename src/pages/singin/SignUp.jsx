import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Auth from '../../components/Layout/Auth'
import { registerBorrower } from '../../modules/borrower/services'
import { login } from '../../lib/auth'
import { toast } from 'react-toastify'
import { Dropdown } from 'primereact/dropdown'
import countriesData from '../../data/countries.json'

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [countryCode, setCountryCode] = useState('USA')
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

  const [availableStates, setAvailableStates] = useState([])

  useEffect(() => {
    const idFromUrl = searchParams.get('id')
    if (idFromUrl) {
      setSignUpId(idFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    const selectedCountry = countriesData.find(c => c.code === countryCode)
    if (selectedCountry) {
      setAvailableStates(selectedCountry.states)
    } else {
      setAvailableStates([])
    }
  }, [countryCode])

  const handleCountryChange = (e) => {
    setCountryCode(e.value)
    setStateVal('') // Reset state when country changes
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!agree) return
    setLoading(true)
    try {
      const selectedCountry = countriesData.find(c => c.code === countryCode)
      const payload = {
        signup_id: signUpId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phoneNumber,
        country_code: selectedCountry ? selectedCountry.phone_code : '',
        country: selectedCountry ? selectedCountry.name : '',
        state: stateVal,
        password: password,
        password_confirmation: confirmPassword
      }
      await registerBorrower(payload)
      await login(email, password, false)
      navigate('/')
    } catch (error) {
      if (error.response && error.response.data) {
        const { errors: apiErrors, message } = error.response.data
        if (apiErrors) {
          setErrors(apiErrors)
        }

      } else {
        toast.error('An error occurred during registration.')
      }
    } finally {
      setLoading(false)
    }
  }

  const countryOptionTemplate = (option) => {
    return (
      <div className="flex align-items-center">
        <div>{option.name} ({option.phone_code})</div>
      </div>
    );
  };

  const selectedCountryTemplate = (option, props) => {
    if (option) {
      return (
        <div className="flex align-items-center">
          <div>{option.code} ({option.phone_code})</div>
        </div>
      );
    }
    return <span>{props.placeholder}</span>;
  };

  return (
    <Auth
      header={(
        <div className="text-center mt-2">
          <div className="mb-3">
            <div className="avatar-lg mx-auto">
              <div className="avatar-title bg-light text-primary display-5 rounded-circle">
                <i className="ri-user-add-line"></i>
              </div>
            </div>
          </div>
          <h5 className="text-primary pb-4 font-weight-bolder">Get Started Now</h5>
        </div>
      )}
      colClass="col-xl-7 col-lg-7 col-md-7"
      bodyClass="p-4"
      belowCard={(
        <div className="mt-4 text-center">
          <p className="mb-0 text-white">Already have an account?{' '}<Link className="fw-semibold text-warning text-decoration-underline" to="/login">Sign in</Link></p>
        </div>
      )}
    >
      <form noValidate onSubmit={handleSubmit} className="signup-page-form">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="first-name">First Name <span className="text-danger">*</span></label>
            <input id="first-name" type="text" className={`form-control ${errors?.first_name ? 'is-invalid' : ''}`} placeholder="Enter first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            {errors?.first_name && (<div className="invalid-feedback">{String(errors.first_name)}</div>)}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="last-name">Last Name <span className="text-danger">*</span></label>
            <input id="last-name" type="text" className={`form-control ${errors?.last_name ? 'is-invalid' : ''}`} placeholder="Enter last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            {errors?.last_name && (<div className="invalid-feedback">{String(errors.last_name)}</div>)}
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="phone-number">Phone Number <span className="text-danger">*</span></label>
            <div className="d-flex gap-2">
              <Dropdown
                value={countryCode}
                onChange={handleCountryChange}
                options={countriesData}
                optionLabel="name"
                optionValue="code"
                valueTemplate={selectedCountryTemplate}
                itemTemplate={countryOptionTemplate}
                filter
                filterBy="name,code,phone_code"
                className="w-auto"
                style={{ minWidth: '120px' }}
              />
              <input id="phone-number" type="tel" className={`form-control ${errors?.phone_number ? 'is-invalid' : ''}`} placeholder="Enter number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
            {errors?.phone_number && (<div className="invalid-feedback d-block">{String(errors.phone_number)}</div>)}
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="state-select">State <span className="text-danger">*</span></label>
            <Dropdown
              id="state-select"
              value={stateVal}
              onChange={(e) => setStateVal(e.value)}
              options={availableStates}
              optionLabel="name"
              optionValue="name"
              placeholder="Select state"
              filter
              className={`w-100 ${errors?.state ? 'p-invalid' : ''}`}
              required
            />
            {errors?.state && (<div className="invalid-feedback d-block">{String(errors.state)}</div>)}
          </div>



          <div className="col-md-6">
            <label className="form-label" htmlFor="email">Email Address <span className="text-danger">*</span></label>
            <input id="email" type="email" className={`form-control ${errors?.email ? 'is-invalid' : ''}`} placeholder="Enter email id" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {errors?.email && (<div className="invalid-feedback">{String(errors.email)}</div>)}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="signup-id">Sign Up Id <span className="text-danger">*</span></label>
            <input id="signup-id" type="text" className={`form-control ${errors?.signup_id ? 'is-invalid' : ''}`} placeholder="Enter sign up id" value={signUpId} onChange={(e) => setSignUpId(e.target.value)} required />
            {errors?.signup_id && (<div className="invalid-feedback">{String(errors.signup_id)}</div>)}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="password-input">Password <span className="text-danger">*</span></label>
            <div className="position-relative auth-pass-inputgroup">
              <input id="password-input" type={showPassword ? 'text' : 'password'} className={`form-control pe-5 ${errors?.password ? 'is-invalid' : ''}`} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon material-shadow-none" onClick={() => setShowPassword((s) => !s)}><i className="ri-eye-fill align-middle"></i></button>
              {errors?.password && (<div className="invalid-feedback">{String(errors.password)}</div>)}
            </div>
            <div className="fs-12 text-muted mt-1">Choose a strong password (8+ chars, upper, lower, number)</div>
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="confirm-password-input">Confirm Password <span className="text-danger">*</span></label>
            <div className="position-relative auth-pass-inputgroup">
              <input id="confirm-password-input" type={showConfirm ? 'text' : 'password'} className={`form-control pe-5 ${errors?.password_confirmation ? 'is-invalid' : ''}`} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button type="button" className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon material-shadow-none" onClick={() => setShowConfirm((s) => !s)}><i className="ri-eye-fill align-middle"></i></button>
              {(errors?.password_confirmation || (password && confirmPassword && password !== confirmPassword)) && (
                <div className="invalid-feedback d-block">{errors?.password_confirmation ? String(errors.password_confirmation) : 'Passwords do not match'}</div>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="form-check">
              <input id="agree" type="checkbox" className="form-check-input" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <label className="form-check-label" htmlFor="agree">I agree to the <Link to="/under-construction/terms" className="text-warning">Terms & conditions</Link></label>
            </div>
          </div>

          <div className="col-12 mt-4">
            <button type="submit" className="btn w-100" disabled={!agree || loading} style={{ background: '#0b2a4a', borderColor: '#0b2a4a', color: '#fff' }}>{loading ? 'Signing up...' : 'Sign up'}</button>
          </div>
        </div>
      </form>
    </Auth>
  )
}
