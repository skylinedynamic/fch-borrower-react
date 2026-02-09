import React from 'react'
import { useLocation } from 'react-router-dom'
import formBg from '../../../assets/images/form-bg.png'

export default function Auth({ header, children, belowCard, colClass = 'col-xl-5 col-lg-6 col-md-8', bodyClass }) {
  const location = useLocation()
  const isSignup = location?.pathname === '/signup'
  const cardMarginClass = isSignup ? 'mt-4 mt-md-0' : 'mt-0'
  return (
    <div className="auth-page-wrapper" style={{minHeight:'100vh',backgroundImage:`url(${formBg})`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'}}>

      <div className="auth-page-content d-flex" style={{minHeight:'100svh'}}>
        <div className="container d-flex justify-content-center align-items-center">
          <div className="row justify-content-center align-items-center w-100">
            <div className={colClass}>
              <div className={`card ${cardMarginClass}`}>
                <div className={`card-body ${bodyClass || 'p-0'}`}>
                  {header}
                  {children}
                </div>
              </div>

              {belowCard}
            </div>
          </div>
        </div>
      
      </div>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center">
                <p className="mb-0 text-muted">&copy; {new Date().getFullYear()} Four Corner Holding. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
