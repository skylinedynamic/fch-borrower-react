import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Auth from '../../components/Layout/Auth'
import { registerBorrower, login } from '../../modules/auth/services'
import { toast } from 'react-toastify'
import { Dropdown } from 'primereact/dropdown'
import { countries as countriesData } from '../../data/countries'
import { formatPhoneNumber } from '../../utils/formatters'
import CustomDropdown from '../profile/components/CustomDropdown'

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

  // Get selected country object
  const selectedCountry = useMemo(() => {
    return countriesData.find(c => c.code === countryCode) || countriesData.find(c => c.name === 'United States')
  }, [countryCode])

  useEffect(() => {
    const idFromUrl = searchParams.get('id')
    if (idFromUrl) {
      setSignUpId(idFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedCountry) {
      setAvailableStates(selectedCountry.states)
    } else {
      setAvailableStates([])
    }
  }, [selectedCountry])

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
      <div className="signup-page">
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
            <div className="input-group">
              <Dropdown
                value={countryCode}
                onChange={handleCountryChange}
                options={countriesData}
                optionLabel="code"
                optionValue="code"
                valueTemplate={(option) => {
                  if (option) {
                    return (
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold">{option.code}</span>
                        <span className="text-muted">{option.phone_code}</span>
                      </div>
                    )
                  }
                  return <span>Select</span>
                }}
                itemTemplate={(option) => {
                  return (
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="fw-medium">{option.code}</span>
                      <span className="text-muted ms-2">{option.phone_code}</span>
                    </div>
                  )
                }}
                className="border-end-0"
                style={{ minWidth: '120px', height: '38px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                panelStyle={{ minWidth: '200px' }}
              />
              <input 
                id="phone-number" 
                type="tel" 
                className={`form-control ${errors?.phone_number ? 'is-invalid' : ''}`} 
                placeholder="(555) 555-5555" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))} 
                required 
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              />
            </div>
            {errors?.phone_number && (<div className="invalid-feedback d-block">{String(errors.phone_number)}</div>)}
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="state-select">State <span className="text-danger">*</span></label>
            <CustomDropdown
              id="state-select"
              value={stateVal}
              onChange={(value) => setStateVal(value)}
              options={availableStates}
              optionLabel="name"
              optionValue="name"
              placeholder="Select state"
              searchable={true}
              className={`w-100 ${errors?.state ? 'is-invalid' : ''}`}
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

          <div className="col-12 mt-2">
            <button type="submit" className="btn w-100 primary-btn" disabled={!agree || loading}>{loading ? 'Signing up...' : 'Sign up'}</button>
          </div>
          
        </div>
      </form>
      </div>
    </Auth>
  )
}
