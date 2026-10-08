import React, { useEffect, useState } from 'react'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchProfileCompletion } from '../../modules/profile/services'
import type { ProfileCompletionStatus } from '../../modules/profile/services'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted } from '../../lib/auth/subscriptionUtils'
import { clearStrayModalBackdrops } from '../../utils/modalBackdrop'
import './ProfileCompleteCheckModal.css'

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

/** Field-name words that are acronyms, kept in capitals ("business_ein" → "Business EIN"). */
const ACRONYMS = new Set(['ein', 'ssn', 'dob', 'zip', 'llc'])

const formatFieldName = (field: string) =>
  field
    .split('_')
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * Asks the borrower to finish the required parts of their profile (Personal,
 * Business, Financial), on every page but Profile, until they have. Only the
 * sections still to finish are listed, each with what is missing, and the
 * first one pulses with "Start here".
 */
const ProfileCompleteCheckModal = () => {
  const [open, setOpen] = useState(false)
  const [completionData, setCompletionData] = useState<ProfileCompletionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const userSubscription = useAuthStore((state) => state.userSubscription)
  const isRestricted = isSubscriptionRestricted(userSubscription)

  useEffect(() => {
    // If restricted, never show the modal
    if (isRestricted) {
      setOpen(false)
      return
    }

    const checkProfileCompletion = async () => {
      try {
        const response = await fetchProfileCompletion()

        if (response.status && response.data) {
          setCompletionData(response.data)

          // Show modal only if profile is incomplete AND not on profile page
          if (!response.data.is_complete && !location.pathname.includes('/profile')) {
            setOpen(true)
          }
        }
      } catch (error) {
        console.error('Error fetching profile completion:', error)
      } finally {
        setLoading(false)
      }
    }

    checkProfileCompletion()
  }, [location.pathname, isRestricted]) // Re-check on route change or status change

  const handleSectionClick = (tab: number) => {
    setOpen(false)
    navigate(`/profile?tab=${tab}`)
  }

  if (loading || !completionData || completionData.is_complete) {
    return null
  }

  // Finished sections are left out.
  const sections = SECTIONS.filter((section) => !completionData[section.type].is_complete)
  const close = () => setOpen(false)

  return (
    <Modal
      isOpen={open}
      toggle={close}
      // Closing it navigates away at the same time; make sure the page is not left locked.
      onClosed={clearStrayModalBackdrops}
      backdrop="static"
      keyboard={false}
      id="profileCompleteModal"
      centered
      size="md"
    >
      <ModalHeader toggle={close} className="pcg-head">
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
      </ModalBody>
    </Modal>
  )
}

export default ProfileCompleteCheckModal
