import React from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import { UncontrolledTooltip } from 'reactstrap'

// Asset Imports
import crownLogo from '../../../../../assets/images/Logos/Crown Office Supplies.png'
import globalLogo from '../../../../../assets/images/Logos/Global-Industrial logo.png'
import graingerLogo from '../../../../../assets/images/Logos/Grainger logo.png'
import mscLogo from '../../../../../assets/images/Logos/MSC Industrial logo.jpg'
import officeGarnerLogo from '../../../../../assets/images/Logos/Office Garner Logo.png'
import quillLogo from '../../../../../assets/images/Logos/Quill Office Supplies.png'
import setonLogo from '../../../../../assets/images/Logos/Seton Logo.png'
import ulineLogo from '../../../../../assets/images/Logos/Uline.png'

export interface TierTaskProps {
  task: TierTaskType
  isCurrentTier?: boolean
  isFirstTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onVerifyClick?: (task: TierTaskType) => void
  tierId?: number
  index?: number
}

const getLogo = (title: string) => {
    if (!title) return null
    const t = title.toLowerCase()
    if (t.includes('uline')) return ulineLogo
    if (t.includes('quill')) return quillLogo
    if (t.includes('crown')) return crownLogo
    if (t.includes('grainger')) return graingerLogo
    if (t.includes('msc')) return mscLogo
    if (t.includes('seton')) return setonLogo
    if (t.includes('office garner') || t.includes('garner')) return officeGarnerLogo
    if (t.includes('global')) return globalLogo
    return null
}

export default function TierTask({ task, isCurrentTier, isFirstTier, onTaskClick, onVerifyClick, tierId, index }: TierTaskProps) {
  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED
  
  // For both first tier and current tier pending tasks, they should be clickable for verification
  const isClickableForVerification = (isFirstTier || isCurrentTier) && !isDone && !isProcessing && !isRejected
  // Navigation is no longer needed for pending tasks in active tiers as they now go directly to verification
  const isClickableForNavigation = false
  // Rejected tasks are NOT clickable for navigation/verification in the same way, but the "Submit Again" button handles it.
  
  const isClickable = isClickableForVerification || isClickableForNavigation
  
  let statusIcon
  if (isDone) {
    statusIcon = <i className="ri-check-line"></i>
  } else if (isProcessing) {
    statusIcon = <i className="ri-loader-4-line spin-animation"></i>
  } else if (isRejected) {
    statusIcon = <i className="ri-close-line"></i>
  } else {
    statusIcon = <span>I</span>
  }

  let statusText
  if (isDone) {
    statusText = 'Verified'
  } else if (isProcessing) {
    statusText = 'Processing'
  } else if (isRejected) {
    statusText = 'Rejected'
  } else {
    statusText = task.button_title || 'Pending Verification'
  }

  let reviewText
  if (isDone) {
    reviewText = 'Verified by FCH'
    if (task.completed_at) {
      reviewText += ` on ${task.completed_at}`
    }
  } else if (isProcessing) {
    reviewText = 'Verification in progress'
  } else if (isRejected) {
    reviewText = 'Verification Rejected'
  } else {
    reviewText = 'Reviewed by FCH underwriting'
  }

  const badgeId = `status-badge-${task.id}`

  const renderStatusBadge = () => (
    <div 
      id={badgeId}
      className={`status-badge ${isDone ? 'completed' : isProcessing ? 'processing' : isRejected ? 'rejected' : 'pending'} ${isClickable ? 'clickable' : ''}`}
      onClick={() => {
        if (isClickableForVerification && onVerifyClick) {
          onVerifyClick(task)
        } else if (isClickableForNavigation && onTaskClick) {
          onTaskClick(task)
        }
      }}
    >
      {statusText}
    </div>
  )

  const isVendorListDesign = (tierId === 2)

  if (isVendorListDesign) {
    const logoSrc = task.logo || getLogo(task.title)

    return (
        <div className="tier-task-item tier-vendor-task-item d-flex align-items-center gap-3 p-3 border rounded mb-2">
            {/* Index Number - Only show if index is provided */}
            {typeof index !== 'undefined' && (
                <div className="tier-index-box d-flex align-items-center justify-content-center bg-warning text-white rounded font-weight-bold" style={{ width: '40px', height: '40px', fontSize: '18px', flexShrink: 0 }}>
                    {index + 1}
                </div>
            )}

            {/* Logo */}
            <div className="tier-logo-box d-flex align-items-center justify-content-center" style={{ width: '80px', height: '40px', flexShrink: 0 }}>
                {logoSrc ? (
                    <img src={logoSrc} alt={task.title} className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                ) : (
                    <div className="text-muted small text-center fw-bold">{task.title.substring(0, 3).toUpperCase()}</div>
                )}
            </div>

            {/* Content */}
            <div className="task-details-col flex-grow-1">
                <div className="task-title fw-bold" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {task.title}
                </div>
                {task.subtitle && (
                    <div className="task-subtitle text-muted small mt-1">
                        {task.subtitle}
                    </div>
                )}
                 <div className="text-secondary small mt-1" style={{ fontSize: '0.8rem' }}>
                    Vendor eligibility reviewed by FCH underwriting
                </div>
            </div>

            {/* Right Side Status */}
            <div className="task-action-col" style={{ minWidth: '140px' }}>
                <div className="d-flex flex-column align-items-end gap-2">
                    {isRejected ? (
                        <>
                            {renderStatusBadge()}
                            <UncontrolledTooltip placement="top" target={badgeId}>
                                {task.rejection_reason || "No reason provided."}
                            </UncontrolledTooltip>
                            {onVerifyClick && (
                                <div 
                                className="status-badge pending clickable" 
                                onClick={() => onVerifyClick(task)}
                                >
                                Submit Again
                                </div>
                            )}
                        </>
                    ) : (
                        renderStatusBadge()
                    )}
                </div>
            </div>
        </div>
    )
  }
  
  return (
    <div className="tier-task-item">
      <div className="d-flex gap-3 align-items-start flex-grow-1">
        {/* Icon Box */}
        <div className="task-icon-col">
          <div className={`task-status-icon ${isDone ? 'completed-icon' : isProcessing ? 'processing-icon' : isRejected ? 'rejected-icon' : 'pending-icon'}`}>
            {statusIcon}
          </div>
        </div>

        {/* Content */}
        <div className="task-details-col">
          <div className="task-title">
            {task.title}
          </div>
          {task.subtitle && (
            <div className="task-subtitle">
              {task.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right Side Status */}
      <div className="task-action-col">
        <div className="d-flex gap-2 align-items-center">
          {isRejected ? (
            <>
           
             
              {/* Rejected Badge with Tooltip */}
              {renderStatusBadge()}
              
              <UncontrolledTooltip placement="top" target={badgeId}>
                {task.rejection_reason || "No reason provided."}
              </UncontrolledTooltip>

                 {/* Submit Again Button */}
              {onVerifyClick && (
                 <div 
                 className="status-badge pending clickable" 
                 onClick={() => onVerifyClick(task)}
               >
                 Submit Again
               </div>
              )}
            </>
          ) : (
            renderStatusBadge()
          )}
        </div>
        <div className="review-status mt-1 text-end">
          {reviewText}
        </div>
      </div>
    </div>
  )
}
