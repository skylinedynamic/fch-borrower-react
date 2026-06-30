import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth } from '../../lib/auth'
import { logout } from '../../modules/auth/services'
import { useAuthStore } from '../../store/auth'
import { useBrandingStore } from '../../store/brandingStore'
import { isSubscriptionRestricted } from '../../lib/auth/subscriptionUtils'
import { PARTNER_TYPES } from '../../config/partnerTypeOptions'
import logoImg from '../../../assets/images/fch-logo-wide.png'
import avatarDefault from '../../../assets/images/users/avatar-1.jpg'

export default function Sidebar() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { branding } = useBrandingStore()

  const user = useAuthStore((state) => state.user)
  const userSubscription = useAuthStore((state) => state.userSubscription)
  const isRestricted = isSubscriptionRestricted(userSubscription)

  const isFreeTrial = !!userSubscription?.is_free_trail;
  const trialEndDate = userSubscription?.free_trail_end_date;

  const formatTrialDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Resolved logos for different sidebar states
  const primaryLogo = branding?.primary_logo_full_url 
  const secondaryLogo = branding?.secondary_logo_full_url 
  const displayLogo = isMobile ? secondaryLogo : primaryLogo
  const compactLogo = secondaryLogo

  // Cleaned up unused context
  const [creditOpen, setCreditOpen] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    return path.includes('/credit-builder')
  })

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 992
      setIsMobile(mobile)
      if (!mobile) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const path = location.pathname
    const inSection = path.includes('/credit-builder')
    if (inSection) setCreditOpen(true)
  }, [location.pathname])

  const menuClass = useMemo(() => 'app-menu navbar-menu', [])

  const toggleOpen = () => {
    const body = typeof document !== 'undefined' ? document.body : null
    const cls = 'vertical-sidebar-enable'
    if (body) {
      const active = body.classList.contains(cls)
      if (active) {
        body.classList.remove(cls)
        setOpen(false)
      } else {
        body.classList.add(cls)
        setOpen(true)
      }
    }
  }

  const closeSidebar = () => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('vertical-sidebar-enable')
    }
    setOpen(false)
  }

  const handleLogout = async (e) => {
    e?.preventDefault?.()
    try {
      await logout()
    } catch (err) {
      console.error('Logout request failed', err)
    } finally {
      clearAuth()
      if (isMobile) toggleOpen()
      navigate('/login', { replace: true })
    }
  }

  // Helper for rendering nav links
  const LinkItem = ({ to, label, icon, restricted, end, highlight }) => (
    <li className="nav-item">
      <NavLink
        end={end}
        className={({ isActive }) => `nav-link menu-link${isActive ? (highlight ? ' active bg-warning text-dark fw-bold' : ' active') : ''}`}
        to={to}
        onClick={(e) => {
          if (restricted) {
            e.preventDefault();
          } else if (isMobile) {
            closeSidebar();
          }
        }}
      >
        <i className={icon}></i> <span>{label} {restricted && <i className="ri-lock-line align-middle ms-1"></i>}</span>
      </NavLink>
    </li>
  )

  return (
    <div className={menuClass}>
      <div className="navbar-brand-box text-start px-2" style={{ lineHeight: '50px' }}>
        <a href="/" className="logo logo-dark" onClick={() => isMobile && closeSidebar()}>
          <span className="logo-sm">
            <img src={compactLogo} alt="" height="50" />
          </span>
          <span className="logo-lg">
            <img src={displayLogo} alt="" style={{ height: '55px', width: 'auto', maxWidth: '200px' }} />
          </span>
        </a>
        <a href="/" className="logo logo-light" onClick={() => isMobile && closeSidebar()}>
          <span className="logo-sm">
            <img src={compactLogo} alt="" height="50" />
          </span>
          <span className="logo-lg">
            <img src={displayLogo} alt="" style={{ height: '55px', width: 'auto', maxWidth: '200px' }} />
          </span>
        </a>


        <button type="button" className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover" onClick={toggleOpen} aria-label="Toggle menu" aria-expanded={open}>
          <i className="ri-menu-line"></i>
        </button>
      </div>


      <div className="dropdown sidebar-user m-1 rounded">
        <button type="button" className="btn material-shadow-none" id="page-header-user-dropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <span className="d-flex align-items-center gap-2">
            <img className="rounded header-profile-user" src={avatarDefault} alt="Header Avatar" />
            <span className="text-start">
              <span className="d-block fw-medium sidebar-user-name-text">{user?.name || 'User'}</span>
              <span className="d-block fs-14 sidebar-user-name-sub-text"><i className="ri ri-circle-fill fs-10 text-success align-baseline"></i> <span className="align-middle">Online</span></span>
            </span>
          </span>
        </button>
        <div className="dropdown-menu dropdown-menu-end">
          <h6 className="dropdown-header">Welcome Anna!</h6>
          <Link className="dropdown-item" to="/profile" onClick={() => isMobile && closeSidebar()}><i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Profile</span></Link>
          <a className="dropdown-item" href="#" onClick={() => isMobile && closeSidebar()}><i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Messages</span></a>
          <a className="dropdown-item" href="#" onClick={() => isMobile && closeSidebar()}><i className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Help</span></a>
          <div className="dropdown-divider"></div>
          <a className="dropdown-item" href="#" onClick={() => isMobile && closeSidebar()}><i className="mdi mdi-wallet text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Balance : <b>$5971.67</b></span></a>
          <a className="dropdown-item" href="#" onClick={() => isMobile && closeSidebar()}><span className="badge bg-success-subtle text-success mt-1 float-end">New</span><i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Settings</span></a>
          <a className="dropdown-item" href="#" onClick={handleLogout}><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Logout</span></a>
        </div>
      </div>

      <div id="scrollbar" data-simplebar className="h-100">
        <div className="container-fluid">
          <div id="two-column-menu"></div>
          <ul className="navbar-nav partner-sidebar" id="navbar-nav">
            <LinkItem to="/" label="Dashboard" icon="ri-dashboard-2-line" end />

            <LinkItem to="/pre-qualification" label="Pre Qualification" icon="ri-clipboard-line" restricted={isRestricted} />
            {/* <LinkItem to="/fund-application" label="Fund Application" icon="ri-hand-coin-line" restricted={isRestricted} /> */}
            <LinkItem to="/funding-reviews" label="Funding Review" icon="ri-file-search-line" restricted={isRestricted} />
            <LinkItem to="/my-applications" label="My Applications" icon="ri-file-list-line" restricted={isRestricted} />
            <LinkItem to="/capital-access" label="Capital Access" icon="ri-funds-line" restricted={isRestricted} />
            <LinkItem to="/invoices" label="Invoices" icon="ri-article-line" />
            <LinkItem to="/payments" label="Payments" icon="ri-money-dollar-box-line" />

            <LinkItem to="/documents" label="Documents" icon="ri-file-2-line" restricted={isRestricted} />
            <LinkItem to="/resources" label="Resource Hub" icon="ri-book-read-line" />
            <LinkItem to="/appointment" label="Appointment" icon="ri-calendar-2-line" restricted={isRestricted} />

            <LinkItem to="/funding" label="Funding" icon="ri-money-dollar-circle-line" restricted={isRestricted} />

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link menu-link btn material-shadow-none w-100 text-start`}
                onClick={(e) => {
                  if (isRestricted) return;
                  setCreditOpen((s) => !s);
                }}
                aria-expanded={creditOpen}
                aria-controls="creditBuilderMenu"
              >
                <i className="ri-building-2-line"></i> <span>Credit Builder {isRestricted && <i className="ri-lock-line align-middle ms-1"></i>}</span>
                <i className={`ri-arrow-down-s-line float-end submenu-caret ${creditOpen ? 'open' : ''}`}></i>
              </button>
              <ul id="creditBuilderMenu" className={`navbar-nav submenu-collapse ${creditOpen ? 'open' : ''}`}>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/overview" onClick={() => isMobile && closeSidebar()}><i className="ri-subtract-line"></i> <span>Overview</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/guide" onClick={() => isMobile && closeSidebar()}><i className="ri-subtract-line"></i> <span>Step-By-Step Guide</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/credit-accounts" onClick={() => isMobile && closeSidebar()}><i className="ri-subtract-line"></i> <span>Credit Accounts</span></NavLink>
                </li>
              </ul>
            </li>

            <LinkItem to="/profile" label="Profile" icon="ri-account-circle-line" restricted={isRestricted} />

            <li className="nav-item">
              <a className="nav-link menu-link" href="#" onClick={handleLogout}>
                <i className="ri-logout-circle-r-line"></i> <span>Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {isFreeTrial && (
        <div className="sidebar-trial-panel">
          <div className="trial-panel-inner">
            <div className="trial-icon-wrap">
              <i className="ri-vip-crown-2-fill"></i>
            </div>
            <div className="trial-text-wrap">
              <span className="trial-label">Free Trial</span>
              {trialEndDate && (
                <span className="trial-expires">Expires {formatTrialDate(trialEndDate)}</span>
              )}
            </div>
            <span className="trial-badge">TRIAL</span>
          </div>
        </div>
      )}

      <div className="sidebar-background"></div>
    </div>
  )
}
