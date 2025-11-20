import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import faviconImg from '../../../assets/images/Favicon.png'
import logoImg from '../../../assets/images/logo.png'
import avatarDefault from '../../../assets/images/users/avatar-1.jpg'

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const [creditOpen, setCreditOpen] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    return /credit-|vendor-application|progress-tracker|resources/.test(path)
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
    const inSection = /credit-|vendor-application|progress-tracker|resources/.test(path)
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

  return (
    <div className={menuClass}>
      <style>{`
        @media (max-width: 991.98px){
          .navbar-brand-box{position:sticky;top:0;z-index:1;background:var(--bs-body-bg);display:block!important}
        }
        .submenu-collapse{overflow:hidden;max-height:0;opacity:.0;transition:max-height .25s ease,opacity .25s ease}
        .submenu-collapse.open{max-height:500px;opacity:1}
        .submenu-caret{transition:transform .2s ease}
        .submenu-caret.open{transform:rotate(180deg)}
        .nav-link.subitem{display:flex;align-items:center;gap:.5rem}
        .partner-sidebar .menu-link{font-weight:600}
        .partner-sidebar .subitem{font-weight:500}
        .partner-sidebar .subitem.active{background:rgba(255,255,255,.06);color:#ffffff}
        .partner-sidebar .subitem.active i{color:#ffffff}
        .partner-sidebar .nav-item{border-bottom:1px solid rgba(255,255,255,.08)}
        .partner-sidebar .nav-item:last-child{border-bottom:0}
        .partner-sidebar .submenu-collapse .nav-item{border-bottom:1px solid rgba(255,255,255,.08)}
        .partner-sidebar .submenu-collapse .nav-item:last-child{border-bottom:0}
      `}</style>
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
          <a className="dropdown-item" href="#"><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Logout</span></a>
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
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/pre-qualification">
                <i className="ri-clipboard-line"></i> <span>Pre Qualification</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/fund-application">
                <i className="ri-hand-coin-line"></i> <span>Fund Application</span>
                <span className="badge bg-info rounded-pill ms-auto">2</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/my-application">
                <i className="ri-file-list-3-line"></i> <span>My Application</span>
                <span className="badge bg-info rounded-pill ms-auto">1</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/documents">
                <i className="ri-file-2-line"></i> <span>Documents</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/appointments">
                <i className="ri-calendar-2-line"></i> <span>Appointment</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <button type="button" className="nav-link menu-link btn material-shadow-none w-100 text-start" onClick={() => setCreditOpen((s) => !s)} aria-expanded={creditOpen} aria-controls="creditBuilderMenu">
                <i className="ri-building-2-line"></i> <span>Credit Builder</span>
                <i className={`ri-arrow-down-s-line float-end submenu-caret ${creditOpen ? 'open' : ''}`}></i>
              </button>
              <ul id="creditBuilderMenu" className={`navbar-nav ms-3 mt-1 submenu-collapse ${creditOpen ? 'open' : ''}`}>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/under-construction/credit-overview"><i className="ri-arrow-right-s-line"></i> <span>Overview</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/under-construction/credit-guide"><i className="ri-arrow-right-s-line"></i> <span>Step-By-Step Guide</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/under-construction/vendor-application"><i className="ri-arrow-right-s-line"></i> <span>Vendor Application</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/under-construction/progress-tracker"><i className="ri-arrow-right-s-line"></i> <span>Progress Tracker</span></NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'} to="/under-construction/resources"><i className="ri-arrow-right-s-line"></i> <span>Resources</span></NavLink>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/profile">
                <i className="ri-user-3-line"></i> <span>Profile</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link menu-link active' : 'nav-link menu-link'} to="/under-construction/logout">
                <i className="ri-logout-circle-r-line"></i> <span>Logout</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>

      <div className="sidebar-background"></div>
    </div>
  )
}
