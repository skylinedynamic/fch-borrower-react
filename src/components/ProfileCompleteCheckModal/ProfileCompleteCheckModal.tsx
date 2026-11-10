import React, { useEffect, useState } from 'react'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatFieldName } from '../../utils/fieldNames'
import { useProfileCompletion } from '../../modules/profile'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted } from '../../lib/auth/subscriptionUtils'
import { clearStrayModalBackdrops } from '../../utils/modalBackdrop'
import { PAYMENT_PATHS, isUnderPath } from '../../config/accessRestriction'
import { clearAuth } from '../../lib/auth'
import { logout } from '../../modules/auth/services'
import './ProfileCompleteCheckModal.css'

/** Pages the popup never covers: the profile itself, and changing the temporary password (BUG-201). */
const UNBLOCKED_PATHS = ['/profile', '/change-password']

type SectionType = 'personal' | 'business' | 'financial'

interface ProfileSection {
  name: string
  icon: string
  type: SectionType
  /** The Profile page tab that holds the section. */
  tab: number
}

const SECTIONS: readonly ProfileSection[] = [
  { name: 'Personal Information', icon: 'ri-account-circle-line', type: 'personal', tab: 0 },
  { name: 'Business Details', icon: 'ri-bank-line', type: 'business', tab: 1 },
  { name: 'Financial', icon: 'ri-file-list-2-line', type: 'financial', tab: 2 },
]

/** How many missing fields to list per section before "+N more fields". */
const FIELDS_SHOWN = 3

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * Asks the borrower to finish the required parts of their profile (Personal,
 * Business, Financial), on every page but Profile and the payment pages
 * (Invoices, Payments, Billing Details - paying comes first), until they have. Only the
 * sections still to finish are listed, each with what is missing, and the
 * first one pulses with "Start here".
 */
const ProfileCompleteCheckModal = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userSubscription = useAuthStore((state) => state.userSubscription)
  const isRestricted = isSubscriptionRestricted(userSubscription)

  // The status the rest of the page reads too (one shared request), refreshed
  // on every page change by the Getting Started walkthrough.
  const { data: completionData } = useProfileCompletion({ enabled: !isRestricted })
  const isComplete = completionData?.is_complete

  useEffect(() => {
    // If restricted, never show the modal
    if (isRestricted) {
      setOpen(false)
      return
    }

    // Paying comes first: the payment pages stay usable, and the popup comes
    // back on the next page the borrower opens.
    if (isUnderPath(location.pathname, PAYMENT_PATHS)) {
      setOpen(false)
      return
    }

    // Show modal only if profile is incomplete AND not on a page it must leave free
    const onUnblockedPage = UNBLOCKED_PATHS.some((path) => location.pathname.includes(path))
    if (isComplete === false && !onUnblockedPage) {
      setOpen(true)
    } else if (onUnblockedPage) {
      setOpen(false)
    }
  }, [location.pathname, isRestricted, isComplete]) // Re-check on route change or status change

  const handleSectionClick = (tab: number) => {
    setOpen(false)
    navigate(`/profile?tab=${tab}`)
  }

  // The popup covers the page, so it offers the two things it must never block.
  const handleChangePassword = () => {
    setOpen(false)
    navigate('/change-password')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      // Even if the API fails, sign out locally.
      console.error('Logout request failed', err)
    } finally {
      setOpen(false)
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  if (isRestricted || !completionData || completionData.is_complete) {
    return null
  }

  // Finished sections are left out.
  const sections = SECTIONS.filter((section) => !completionData[section.type].is_complete)

  return (
    // It can't be dismissed - no close or cancel button, no Escape: the way out
    // is to pick a section to complete. Changing the password and logging out
    // stay possible from it (BUG-201).
    <Modal
      isOpen={open}
      // Closing it navigates away at the same time; make sure the page is not left locked.
      onClosed={clearStrayModalBackdrops}
      backdrop="static"
      keyboard={false}
      id="profileCompleteModal"
      centered
      size="md"
    >
      <ModalHeader className="pcg-head">
        Complete Your Profile
      </ModalHeader>
      <ModalBody className="pcg-body">
        <h3 className="pcg-title">Your profile needs attention</h3>
        <p className="pcg-subtitle">Complete the sections below to unlock your dashboard and all features.</p>

        {sections.map((section, index) => {
          const missing = completionData[section.type].missing_fields
          const isNext = index === 0
          return (
            <button
              key={section.type}
              type="button"
              className={`pcg-row${isNext ? ' is-next' : ''}`}
              onClick={() => handleSectionClick(section.tab)}
            >
              <span className="pcg-icon" aria-hidden="true">
                <i className={section.icon}></i>
              </span>
              <span className="pcg-text">
                <b className="pcg-name">{section.name}</b>
                <span className="pcg-pill">{plural(missing.length, 'field')}</span>
                <ul className="pcg-fields">
                  {missing.slice(0, FIELDS_SHOWN).map((field) => (
                    <li key={field}>{formatFieldName(field)}</li>
                  ))}
                </ul>
                {missing.length > FIELDS_SHOWN && (
                  <i className="pcg-more">+{plural(missing.length - FIELDS_SHOWN, 'more field')}</i>
                )}
                {isNext && <span className="pcg-start">◀ Start here</span>}
              </span>
              <span className="pcg-arrow" aria-hidden="true">
                →
              </span>
            </button>
          )
        })}

        <div className="pcg-account">
          <button type="button" className="btn btn-link btn-sm" onClick={handleChangePassword}>
            <i className="ri-lock-password-line align-middle me-1" aria-hidden="true"></i>Change password
          </button>
          <button type="button" className="btn btn-link btn-sm" onClick={handleLogout}>
            <i className="mdi mdi-logout align-middle me-1" aria-hidden="true"></i>Log out
          </button>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default ProfileCompleteCheckModal
