import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchProfileCompletion } from '../../modules/profile/services'
import { useAuthStore } from '../../store/auth'
import { isSubscriptionRestricted } from '../../lib/auth/subscriptionUtils'

const ProfileCompleteCheckModal = () => {
  const [modal_backdrop, setmodal_backdrop] = useState(false)
  const [completionData, setCompletionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const userSubscription = useAuthStore((state) => state.userSubscription)
  const isRestricted = isSubscriptionRestricted(userSubscription)

  useEffect(() => {
    // If restricted, never show the modal
    if (isRestricted) {
      setmodal_backdrop(false)
      return
    }

    const checkProfileCompletion = async () => {
      try {
        const response = await fetchProfileCompletion()
        
        if (response.status && response.data) {
          setCompletionData(response.data)
          
          // Show modal only if profile is incomplete AND not on profile page
          if (!response.data.is_complete && !location.pathname.includes('/profile')) {
            setmodal_backdrop(true)
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

  const getIncompleteSections = () => {
    if (!completionData) return []
    
    const sections = []
    
    if (!completionData.personal.is_complete) {
      sections.push({
        name: 'Personal Information',
        icon: 'ri-user-line',
        type: 'personal',
        tab: 0,
        missingFields: completionData.personal.missing_fields
      })
    }
    
    if (!completionData.business.is_complete) {
      sections.push({
        name: 'Business Details',
        icon: 'ri-building-line',
        type: 'business',
        tab: 1,
        missingFields: completionData.business.missing_fields
      })
    }
    
    if (!completionData.financial.is_complete) {
      sections.push({
        name: 'Financial',
        icon: 'ri-money-dollar-circle-line',
        type: 'financial',
        tab: 2,
        missingFields: completionData.financial.missing_fields
      })
    }
    
    return sections
  }

  const formatFieldName = (field) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleSectionClick = (tab) => {
    setmodal_backdrop(false)
    navigate(`/profile?tab=${tab}`)
  }

  if (loading || !completionData || completionData.is_complete) {
    return null
  }

  const incompleteSections = getIncompleteSections()

  return (
    <Modal
      isOpen={modal_backdrop}
      toggle={() => setmodal_backdrop(false)}
      backdrop={'static'}
      keyboard={false}
      id="profileCompleteModal"
      centered
      size="md"
    >
      {/* No close button: the way out is to pick a section to complete. */}
      <ModalHeader>
        <h5 className="modal-title mb-3">
          <i className="ri-user-settings-line me-2"></i>
          Complete Your Profile
        </h5>
      </ModalHeader>
      <ModalBody className="p-3">
        <div className="text-center mb-3">
          <div className="pcm-icon-circle d-inline-flex align-items-center justify-content-center rounded-circle mb-3">
            <i className="ri-alert-line"></i>
          </div>
          <h5 className="mb-2 pcm-title">
            Your Profile Needs Attention
          </h5>
          <p className="text-muted mb-0 pcm-subtitle">
            Complete the sections below to unlock all features
          </p>
        </div>

        {incompleteSections.length > 0 && (
          <div className="row g-2">
            {incompleteSections.map((section, index) => (
              <div key={index} className="col-12">
                <div 
                  className="card border-0 mb-0 position-relative overflow-hidden pcm-section-card"
                  onClick={() => handleSectionClick(section.tab)}
                >
                  <div className={`pcm-accent-bar ${section.type}`} />
                  
                  <div className="card-body p-2 ps-3">
                    <div className="d-flex align-items-start">
                      <div className={`pcm-icon-box ${section.type} flex-shrink-0 me-3 d-flex align-items-center justify-content-center rounded`}>
                        <i className={section.icon}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <h6 className={`mb-1 me-2 pcm-section-title`}>
                            {section.name}
                          </h6>
                          <span className={`badge rounded-pill pcm-badge ${section.type}`}>
                            {section.missingFields.length} field{section.missingFields.length > 1 ? 's' : ''}
                          </span>
                          <i className={`ri-arrow-right-line ms-auto pcm-arrow ${section.type}`}></i>
                        </div>
                        {section.missingFields.length > 0 && (
                          <div className="text-muted pcm-fields">
                            {section.missingFields.slice(0, 3).map((field, idx) => (
                              <div key={idx} className="d-flex align-items-center mb-0">
                                <i className={`ri-checkbox-blank-circle-fill me-2 pcm-field-dot ${section.type}`}></i>
                                <span>{formatFieldName(field)}</span>
                              </div>
                            ))}
                            {section.missingFields.length > 3 && (
                              <div className="text-muted fst-italic mt-1 pcm-more">
                                +{section.missingFields.length - 3} more field{section.missingFields.length - 3 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}

export default ProfileCompleteCheckModal
