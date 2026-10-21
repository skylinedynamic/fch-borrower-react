import React, { useEffect, useState } from 'react'
import { clearAuth } from '../../lib/auth'
import { useAuthStore } from '../../store/auth'
import { useBrandingStore } from '../../store/brandingStore'
import { logout } from '../../modules/auth/services'
import avatarDefault from '../../../assets/images/users/avatar-default.jpg'
import { resolveBrandLogo } from '../../utils/brandLogo'
import BrandLogo from './BrandLogo'
import NotificationBell from './NotificationBell'

import { useNavigate, Link } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  const storeUser = useAuthStore((state) => state.user)
  const { branding } = useBrandingStore()
  const [user, setUser] = useState(null)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-sidebar-size') || 'lg') === 'sm'
    }
    return false
  })

  useEffect(() => {
    setUser(storeUser)
  }, [storeUser])

  const handleLogout = async (e) => {
    e?.preventDefault?.()
    try {
      // Call API to invalidate server session/token
      await logout()
    } catch (err) {
      // Even if API fails, proceed to clear local auth
      console.error('Logout request failed', err)
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  const avatarSrc = avatarDefault
  const displayName = user?.name
  const displayRole = user?.role

  const toggleSidebar = () => {
    const w = window.innerWidth
    if (w < 768) {
      document.body.classList.toggle('vertical-sidebar-enable')
      return
    }
    document.body.classList.remove('vertical-sidebar-enable')
    const docEl = document.documentElement
    const current = docEl.getAttribute('data-sidebar-size') || 'lg'
    const next = current === 'lg' ? 'sm' : 'lg'
    docEl.setAttribute('data-sidebar-size', next)
    setIsSidebarCollapsed(next === 'sm')
    try {
      sessionStorage.setItem('data-sidebar-size', next)
    } catch (e) { }
  }

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        document.body.classList.remove('vertical-sidebar-enable')
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return (
    <header id="page-topbar">
      <style>{`
        #page-topbar .app-search .form-control{background-color:var(--vz-topbar-search-bg);color:var(--vz-topbar-search-color)}
        #page-topbar .app-search .form-control:focus{background-color:var(--vz-topbar-search-bg);box-shadow:none}
        #page-topbar .btn-topbar{display:inline-flex;align-items:center;justify-content:center;padding:0}
        #page-topbar .btn-topbar:hover,#page-topbar .btn-topbar:focus{background-color:var(--vz-header-item-bg)}
      `}</style>
      <div className="layout-width">
        <div className="navbar-header">
          <div className="d-flex align-items-center">
            <button type="button" className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger material-shadow-none" id="topnav-hamburger-icon" onClick={toggleSidebar}>
              {isSidebarCollapsed ? (
                <i className="bx bx-chevron-right fs-20"></i>
              ) : (
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              )}
            </button>

            <div className="navbar-brand-box horizontal-logo ms-2">
              <a href="/" className="logo logo-dark">
                <BrandLogo
                  src={resolveBrandLogo(
                    branding?.logo_mobile_full_url,
                    branding?.logo_document_full_url,
                    branding?.logo_sidebar_full_url,
                  )}
                  fallbackText={branding?.site_name}
                  height="50"
                />
              </a>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <NotificationBell />
            <div className="dropdown ms-sm-3 header-item topbar-user">
              <button type="button" className="btn material-shadow-none" id="page-header-user-dropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span className="d-flex align-items-center">

                  <img className="rounded-circle header-profile-user" src={avatarSrc} alt="Header Avatar" />
                  <span className="text-start ms-xl-2">
                    <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{displayName}</span>
                    <span className="d-none d-xl-block ms-1 fs-12 user-name-sub-text">{displayRole}</span>
                  </span>
                </span>
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                {/* <a className="dropdown-item" href="#"><i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Profile</span></a>
                <a className="dropdown-item" href="#"><i className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Help</span></a>
                <div className="dropdown-divider"></div> */}
                {/* <a className="dropdown-item" href="#"><i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Settings</span></a> */}
                <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); navigate('/change-password'); }}>
                  <i className="mdi mdi-lock-reset text-muted fs-16 align-middle me-1"></i>
                  <span className="align-middle">Change Password</span>
                </a>
                {!!user?.is_agreement_signed && (
                  <Link className="dropdown-item" to={`/download-agreement/${user.id}`} target="_blank">
                    <i className="mdi mdi-file-document-outline text-muted fs-16 align-middle me-1"></i>
                    <span className="align-middle">My Agreement</span>
                  </Link>
                )}
                <a className="dropdown-item" href="#" onClick={handleLogout}><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Logout</span></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}