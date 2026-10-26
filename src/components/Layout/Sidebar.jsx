import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth } from '../../lib/auth'
import { logout } from '../../modules/auth/services'
import { useAuthStore } from '../../store/auth'
import { useBrandingStore } from '../../store/brandingStore'
import { isSubscriptionRestricted, isFreeTrialLocked, getRestrictionReason } from '../../lib/auth/subscriptionUtils'
import RestrictedAccessModal from './RestrictedAccessModal'
import { PARTNER_TYPES } from '../../config/partnerTypeOptions'
import { resolveBrandLogo } from '../../utils/brandLogo'
import BrandLogo from './BrandLogo'
import avatarDefault from '../../../assets/images/users/avatar-1.jpg'
import { useActiveFundingRequests } from '../../modules/dashboard'
import { useUnreadNotificationCount, formatUnreadCount } from '../../modules/notifications'
import { NOTIFICATIONS_ROUTE } from '../../config/notifications'
import { ONBOARDING_MENU } from '../../config/onboardingSteps'
import OnboardingMenuArrow, { useOnboardingMenuArrow } from '../Onboarding/OnboardingMenuArrow'

export default function Sidebar() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { branding } = useBrandingStore()

  const user = useAuthStore((state) => state.user)
  const userSubscription = useAuthStore((state) => state.userSubscription)
  const isRestricted = isSubscriptionRestricted(userSubscription)
  // A locked menu (or a locked page the guard sent back here) explains itself
  // in a modal instead of doing nothing (BUG-033).
  const restrictionReason = getRestrictionReason(userSubscription)
  const [restrictedOpen, setRestrictedOpen] = useState(false)
  useEffect(() => {
    if (location.state?.restrictedFrom && restrictionReason) setRestrictedOpen(true)
  }, [location.key, restrictionReason])

  const isFreeTrial = !!userSubscription?.is_free_trail;
  // Modules locked exclusively during the Limited Free Edition (free trial)
  const isFreeTierModule = isFreeTrialLocked(userSubscription);

  // Resolved logos for different sidebar states
  // Logos are chosen by the background they sit on. The legacy keys are read as a
  // fallback so a partner who has not re-uploaded keeps their existing logo.
  const primaryLogo = branding?.logo_sidebar_full_url
  const secondaryLogo = branding?.logo_document_full_url
  const markLogo = branding?.favicon_full_url
  // The mobile brand box now carries the sidebar colour, so it takes the dark-background logo too.
  //
  // Both end at the packaged default rather than at undefined, which is what the
  // <img> tags below used to be handed - and rendered as a broken-image icon -
  // whenever a tenant had uploaded nothing. A tenant branded as itself never
  // reaches that default: the API substitutes a placeholder carrying its own
  // company name so the host's logo cannot appear in its sidebar.
  const displayLogo = resolveBrandLogo(primaryLogo, secondaryLogo)
  const compactLogo = resolveBrandLogo(markLogo, secondaryLogo)
  // What the brand box shows if the logo file itself can't be loaded.
  const brandName = branding?.site_name || branding?.meta_title || null

  const { data: activeFundingRequests } = useActiveFundingRequests()
  const activeApprovedRequest = activeFundingRequests?.data?.active_approved_funding_request
  const activeApprovedRequestCount = activeFundingRequests?.data?.active_approved_funding_request_count || 0
  // Same cached query as the header bell, so this adds no extra request.
  const { data: unreadNotificationCount = 0 } = useUnreadNotificationCount()

  // The Getting Started walkthrough's arrow: which menu item to open next.
  const onboardingArrow = useOnboardingMenuArrow()
  const arrowTagFor = (target) => (onboardingArrow?.target === target ? onboardingArrow.tag : null)
  // The walkthrough target inside the Credit Builder group, if any: the guide or Credit Accounts.
  const creditBuilderArrowTag = arrowTagFor(ONBOARDING_MENU.STEP_GUIDE) || arrowTagFor(ONBOARDING_MENU.CREDIT_ACCOUNTS)

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

  // `has-trial-panel` switches the sidebar to a flex column so the banner takes
  // part in the layout instead of floating over the last menu item. Only when
  // there is a banner, so a paid plan keeps the theme's own layout untouched.
  const menuClass = useMemo(
    () => (isFreeTrial ? 'app-menu navbar-menu has-trial-panel' : 'app-menu navbar-menu'),
    [isFreeTrial]
  )

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

  const LinkItem = ({ to, label, icon, restricted, end, highlight, badge, badgeBlink, arrowTag }) => (
    <li className={`nav-item${arrowTag ? ' onb-menu-target' : ''}`}>
      <NavLink
        end={end}
        className={({ isActive }) => `nav-link menu-link${isActive ? (highlight ? ' active bg-warning text-dark fw-bold' : ' active') : ''}`}
        to={to}
        onClick={(e) => {
          if (restricted) {
            e.preventDefault();
            if (isRestricted) setRestrictedOpen(true);
          } else if (isMobile) {
            closeSidebar();
          }
        }}
      >
        <i className={icon}></i>
        <span className="d-flex align-items-center w-100">
          {label}
          {restricted && <i className="ri-lock-line align-middle ms-1"></i>}
          {badge && <span className={`badge ms-auto rounded-pill bg-danger ${badgeBlink ? 'animate-blink' : ''}`}>{badge}</span>}
          {arrowTag && <OnboardingMenuArrow tag={arrowTag} />}
        </span>
      </NavLink>
    </li>
  )

  return (
    <div className={menuClass}>
      <div className="navbar-brand-box text-start px-2" style={{ lineHeight: '50px' }}>
        <a href="/" className="logo logo-dark" onClick={() => isMobile && closeSidebar()}>
          <span className="logo-sm">
            <BrandLogo src={compactLogo} fallbackText={brandName} height="50" />
          </span>
          <span className="logo-lg">
            <BrandLogo src={displayLogo} fallbackText={brandName} style={{ height: '55px', width: 'auto', maxWidth: '200px' }} />
          </span>
        </a>
        <a href="/" className="logo logo-light" onClick={() => isMobile && closeSidebar()}>
          <span className="logo-sm">
            <BrandLogo src={compactLogo} fallbackText={brandName} height="50" />
          </span>
          <span className="logo-lg">
            <BrandLogo src={displayLogo} fallbackText={brandName} style={{ height: '55px', width: 'auto', maxWidth: '200px' }} />
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
          <h6 className="dropdown-header">Welcome {user?.name || 'User'}!</h6>
          <Link className="dropdown-item" to="/profile" onClick={() => isMobile && closeSidebar()}><i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Profile</span></Link>
          <Link className="dropdown-item" to="/change-password" onClick={() => isMobile && closeSidebar()}><i className="mdi mdi-lock-reset text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Change Password</span></Link>
          <div className="dropdown-divider"></div>
          <button type="button" className="dropdown-item" onClick={handleLogout}><i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Logout</span></button>
        </div>
      </div>

      <div id="scrollbar" data-simplebar className="h-100">
        <div className="container-fluid">
          <div id="two-column-menu"></div>
          <ul className="navbar-nav partner-sidebar" id="navbar-nav">
            <LinkItem to="/" label="Dashboard" icon="ri-dashboard-2-line" end />

            <LinkItem to="/pre-qualification" label="Pre Qualification" icon="ri-clipboard-line" restricted={isRestricted} />
            {/* <LinkItem to="/fund-application" label="Fund Application" icon="ri-hand-coin-line" restricted={isRestricted} /> */}
            <LinkItem
              to="/funding-requests"
              label="Funding Request"
              icon="ri-file-search-line"
              restricted={isRestricted}
              badge={activeApprovedRequestCount > 0 ? activeApprovedRequestCount : undefined}
            />
            <LinkItem to="/my-applications" label="My Applications" icon="ri-file-list-line" restricted={isRestricted} />

            {/* Credit Card Stacking — locked on free trial */}
            <LinkItem to="/credit-card-stacking" label="Credit Card Stacking" icon="ri-bank-card-line" restricted={isFreeTierModule || isRestricted} arrowTag={arrowTagFor(ONBOARDING_MENU.CREDIT_CARD_STACKING)} />

            {/* Invoices — locked on free trial */}
            <LinkItem to="/invoices" label="Invoices" icon="ri-article-line" restricted={isFreeTierModule} />

            {/* Payments — locked on free trial */}
            <LinkItem to="/payments" label="Payments" icon="ri-money-dollar-box-line" restricted={isFreeTierModule} />

            {/* Billing Details — locked on free trial */}
            <LinkItem to="/billing-details" label="Billing Details" icon="ri-bank-card-line" restricted={isFreeTierModule || isRestricted} />

            <LinkItem to="/documents" label="Documents" icon="ri-file-2-line" restricted={isRestricted} arrowTag={arrowTagFor(ONBOARDING_MENU.DOCUMENTS)} />

            {/* Resource Hub — locked on free trial */}
            <LinkItem to="/resources" label="Resource Hub" icon="ri-book-read-line" restricted={isFreeTierModule || isRestricted} />

            <LinkItem to="/appointment" label="Appointment" icon="ri-calendar-2-line" restricted={isRestricted} arrowTag={arrowTagFor(ONBOARDING_MENU.APPOINTMENT)} />

            <LinkItem to="/funding" label="Funding" icon="ri-money-dollar-circle-line" restricted={isRestricted} arrowTag={arrowTagFor(ONBOARDING_MENU.FUNDING)} />
            {/* Credit Builder — locked on free trial */}
            <li className={`nav-item${creditBuilderArrowTag && !creditOpen ? ' onb-menu-target' : ''}`}>
              <button
                type="button"
                className={`nav-link menu-link btn material-shadow-none w-100 text-start`}
                onClick={() => {
                  if (isRestricted) setRestrictedOpen(true);
                  if (isRestricted || isFreeTierModule) return;
                  setCreditOpen((s) => !s);
                }}
                aria-expanded={creditOpen}
                aria-controls="creditBuilderMenu"
              >
                <i className="ri-building-2-line"></i> <span>Credit Builder {(isRestricted || isFreeTierModule) && <i className="ri-lock-line align-middle ms-1"></i>}</span>
                {/* The guide and Credit Accounts are inside this group: point at the group until it is open. */}
                {!creditOpen && creditBuilderArrowTag && <OnboardingMenuArrow tag={creditBuilderArrowTag} />}
                <i className={`ri-arrow-down-s-line float-end submenu-caret ${creditOpen ? 'open' : ''}`}></i>
              </button>
              <ul id="creditBuilderMenu" className={`navbar-nav submenu-collapse ${creditOpen ? 'open' : ''}`}>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'}
                    to="/credit-builder/overview"
                    onClick={(e) => { if (isFreeTierModule) { e.preventDefault(); return; } isMobile && closeSidebar(); }}
                  ><i className="ri-subtract-line"></i> <span>Overview</span></NavLink>
                </li>
                <li className={`nav-item${arrowTagFor(ONBOARDING_MENU.STEP_GUIDE) ? ' onb-menu-target' : ''}`}>
                  <NavLink
                    className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'}
                    to="/credit-builder/guide"
                    onClick={(e) => { if (isFreeTierModule) { e.preventDefault(); return; } isMobile && closeSidebar(); }}
                  ><i className="ri-subtract-line"></i> <span>Step-By-Step Guide</span>
                    {creditOpen && arrowTagFor(ONBOARDING_MENU.STEP_GUIDE) && <OnboardingMenuArrow tag={arrowTagFor(ONBOARDING_MENU.STEP_GUIDE)} />}
                  </NavLink>
                </li>
                <li className={`nav-item${arrowTagFor(ONBOARDING_MENU.CREDIT_ACCOUNTS) ? ' onb-menu-target' : ''}`}>
                  <NavLink
                    className={({ isActive }) => isActive ? 'nav-link subitem active' : 'nav-link subitem'}
                    to="/credit-builder/credit-accounts"
                    onClick={(e) => { if (isFreeTierModule) { e.preventDefault(); return; } isMobile && closeSidebar(); }}
                  ><i className="ri-subtract-line"></i> <span>Credit Accounts</span>
                    {creditOpen && arrowTagFor(ONBOARDING_MENU.CREDIT_ACCOUNTS) && <OnboardingMenuArrow tag={arrowTagFor(ONBOARDING_MENU.CREDIT_ACCOUNTS)} />}
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Notifications — never locked: the header bell works on every plan */}
            <LinkItem
              to={NOTIFICATIONS_ROUTE}
              label="Notifications"
              icon="ri-notification-3-line"
              badge={unreadNotificationCount > 0 ? formatUnreadCount(unreadNotificationCount) : undefined}
            />

            <LinkItem to="/profile" label="Profile" icon="ri-account-circle-line" restricted={isRestricted} arrowTag={arrowTagFor(ONBOARDING_MENU.PROFILE)} />

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
              <span className="trial-label">Free Plan</span>
              <span className="trial-expires">Lifetime Access</span>
            </div>
            <span className="trial-badge">FREE</span>
          </div>
        </div>
      )}

      <div className="sidebar-background"></div>

      <RestrictedAccessModal reason={restrictionReason} isOpen={restrictedOpen} onClose={() => setRestrictedOpen(false)} />
    </div>
  )
}
