import React from 'react'
import { useLocation } from 'react-router-dom'
import formBg from '../../../assets/images/form-bg.png'
import logoImg from '../../../assets/images/fch-logo-wide.png'
import { fetchThemeConfigurations } from '../../modules/auth/services'

export default function Auth({ header, children, belowCard, colClass = 'col-xl-5 col-lg-6 col-md-8', bodyClass }) {
  const location = useLocation()
  const [settings, setSettings] = React.useState(() => {
    try {
      const cached = localStorage.getItem('public_branding');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  })

  // const isSignup = location?.pathname === '/signup'
  const cardMarginClass = 'mt-0'

  React.useEffect(() => {
    fetchThemeConfigurations()
      .then((data) => {
        if (data) {
          setSettings(data)
          localStorage.setItem('public_branding', JSON.stringify(data))
          if (data.primary_color) {
            document.documentElement.style.setProperty('--primary-color', data.primary_color)
          }
          if (data.secondary_color) {
            document.documentElement.style.setProperty('--secondary-color', data.secondary_color)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch theme configurations', err)
      })
  }, [])

  const displayLogo = settings?.primary_logo_full_url || logoImg
  const displaySiteName = settings?.site_name || 'Four Corner Funding'

  return (
    <div className="auth-page-wrapper" style={{ minHeight: '100vh', backgroundImage: `url(${formBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>

      <div className="auth-page-content d-flex" style={{ minHeight: '100svh' }}>
        <div className="container d-flex justify-content-center align-items-center">

          <div className="row justify-content-center align-items-center w-100">
            <div className={colClass}>

              <div className="text-center mb-5">
                <a href="/" className="d-inline-block auth-logo">
                  <img src={displayLogo} alt={displaySiteName} width="250" height="auto" />
                </a>
              </div>

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
                <p className="mb-0 text-muted">
                  {`© ${new Date().getFullYear()} ${displaySiteName}. All rights reserved.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
