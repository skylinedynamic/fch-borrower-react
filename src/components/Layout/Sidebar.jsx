import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth } from '../../lib/auth'
import { logout } from '../../modules/auth/services'
import faviconImg from '../../../assets/images/Favicon.png'
import logoImg from '../../../assets/images/logo.png'
import avatarDefault from '../../../assets/images/users/avatar-1.jpg'
export default function Sidebar() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const { pathname } = location
  
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
    const next = !open
    setOpen(next)
    if (body) {
      if (next) body.classList.add(cls)
      else body.classList.remove(cls)
    }
  }

  const handleLogout = async (e) => {
    e?.preventDefault?.()
    try {
      await logout()
    } catch (err) {
      console.error('Logout request failed', err)
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className={menuClass}>
      <div className="navbar-brand-box py-2">
        <a href="/" className="logo logo-dark">
          <span className="logo-sm">
            <img src={faviconImg} alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src={logoImg} alt="" height="17" />
          </span>
        </a>
        <a href="/" className="logo logo-light">
          <span className="logo-sm">
            <img src={faviconImg} alt="" height="40" />
          </span>
          <span className="logo-lg">
            <img src={logoImg} alt="" height="120" />
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
              <span className="d-block fw-medium sidebar-user-name-text">Anna Adame</span>
              <span className="d-block fs-14 sidebar-user-name-sub-text"><i className="ri ri-circle-fill fs-10 text-success align-baseline"></i> <span className="align-middle">Online</span></span>
            </span>
          </span>
        </button>
        <div className="dropdown-menu dropdown-menu-end">
          <h6 className="dropdown-header">Welcome Anna!</h6>
          <a className="dropdown-item" href="#"><i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Profile</span></a>
          <a className="dropdown-item" href="#"><i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Messages</span></a>
          <a className="dropdown-item" href="#"><i className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Help</span></a>
          <div className="dropdown-divider"></div>
          <a className="dropdown-item" href="#"><i className="mdi mdi-wallet text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Balance : <b>$5971.67</b></span></a>
          <a className="dropdown-item" href="#"><span className="badge bg-success-subtle text-success mt-1 float-end">New</span><i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Settings</span></a>
          <a className="dropdown-item" href="#" onClick={handleLogout}><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Logout</span></a>
        </div>
      </div>

      <div id="scrollbar" data-simplebar className="h-100">
        <div className="container-fluid">
          <div id="two-column-menu"></div>
          <ul className="navbar-nav partner-sidebar" id="navbar-nav">
            <li className="nav-item">
              <NavLink end className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/">
                <i className="ri-dashboard-2-line"></i> <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link menu-link${isActive ? ' active' : ''}`} 
                to="/pre-qualification"
              >
                <i className="ri-clipboard-line"></i> <span>Pre Qualification</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link menu-link${isActive ? ' active' : ''}`} 
                to="/fund-application"
              >
                <i className="ri-hand-coin-line"></i> <span>Fund Application</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link menu-link${isActive ? ' active' : ''}`} 
                to="/my-applications"
              >
                <i className="ri-file-list-line"></i> <span>My Applications</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/invoices">
                <i className="ri-article-line"></i> <span>Invoices</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link menu-link${isActive ? ' active' : ''}`} 
                to="/documents"
              >
                <i className="ri-file-2-line"></i> <span>Documents</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link menu-link${isActive ? ' active' : ''}`} 
                to="/appointment"
              >
                <i className="ri-calendar-2-line"></i> <span>Appointment</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link menu-link btn material-shadow-none w-100 text-start`}
                onClick={(e) => {
                  setCreditOpen((s) => !s);
                }} 
                aria-expanded={creditOpen} 
                aria-controls="creditBuilderMenu"
              >
                <i className="ri-building-2-line"></i> <span>Credit Builder</span>
                <i className={`ri-arrow-down-s-line float-end submenu-caret ${creditOpen ? 'open' : ''}`}></i>
              </button>
              <ul id="creditBuilderMenu" className={`navbar-nav ms-3 mt-1 submenu-collapse ${creditOpen ? 'open' : ''}`}>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/overview"><i className="ri-arrow-right-s-line"></i> <span>Overview</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/guide"><i className="ri-arrow-right-s-line"></i> <span>Step-By-Step Guide</span></NavLink>
                </li>
                {/* <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/vendor-application"><i className="ri-arrow-right-s-line"></i> <span>Vendor Application</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/progress-tracker"><i className="ri-arrow-right-s-line"></i> <span>Progress Tracker</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/credit-builder/resources"><i className="ri-arrow-right-s-line"></i> <span>Resources</span></NavLink>
                </li> */}
              </ul>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => `nav-link menu-link${isActive ? ' active' : ''}`} 
                to="/profile"
              >
                <i className="ri-account-circle-line"></i> <span>Profile</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <a className="nav-link menu-link" href="#" onClick={handleLogout}>
                <i className="ri-logout-circle-r-line"></i> <span>Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="sidebar-background"></div>
    </div>
  )
}
