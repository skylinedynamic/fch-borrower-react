import React, { useState } from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import { UncontrolledTooltip } from 'reactstrap'
import TaskDetailsModal from './TaskDetailsModal'

// Asset Imports
import crownLogo from '../../../../../assets/images/Logos/Crown Office Supplies.png'
import globalLogo from '../../../../../assets/images/Logos/Global-Industrial logo.png'
import graingerLogo from '../../../../../assets/images/Logos/Grainger logo.png'
import mscLogo from '../../../../../assets/images/Logos/MSC Industrial logo.jpg'
import officeGarnerLogo from '../../../../../assets/images/Logos/Office Garner Logo.png'
import quillLogo from '../../../../../assets/images/Logos/Quill Office Supplies.png'
import setonLogo from '../../../../../assets/images/Logos/Seton Logo.png'
import ulineLogo from '../../../../../assets/images/Logos/Uline.png'

export interface Tier2TaskProps {
  task: TierTaskType
  isCurrentTier?: boolean
  isFirstTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onVerifyClick?: (task: TierTaskType) => void
  index: number
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

export default function Tier2Task({ task, isCurrentTier, isFirstTier, onTaskClick, onVerifyClick, index }: Tier2TaskProps) {
  const [modalOpen, setModalOpen] = useState(false)
  
  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED
  
  let statusText
  if (isDone) {
    statusText = 'Verified'
  } else if (isProcessing) {
    statusText = 'Processing'
  } else if (isRejected) {
    statusText = 'Rejected'
  } else {
    statusText = 'Pending' // Simplified for Tier 2 as per new design
  }

  const badgeId = `status-badge-${task.id}`

  const renderStatusBadge = () => (
    <div 
      id={badgeId}
      className={`status-badge ${isDone ? 'completed' : isProcessing ? 'processing' : isRejected ? 'rejected' : 'pending'}`}
    >
      {statusText}
    </div>
  )

  const logoSrc = task.logo || getLogo(task.title)

  return (
    <>
        {/* Tier 1 Warning Box - Only for first item */}
        {index === 0 && (
            <div>
                <div className="alert alert-warning border-0 shadow-sm p-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ri-lightbulb-fill text-warning fs-1"></i>
                        <h6 className="mb-0 text-dark fs-5">Before Starting Tier 1, Please Read Carefully.</h6>
                        </div>
                        <ul className="mb-0 ps-3 text-muted custom-list">
                        <li className="mb-1">Tier 1 requires <b>opening accounts with approved starter vendors</b> before proceeding.</li>
                        <li className="mb-1">Every business is unique; always <b>read guidance</b> before acting.</li>
                        <li className="mb-1">Account progress is only confirmed after opening and verified by FCH.</li>
                        <li>Do not apply for vendors outside this list. Doing so may result in denials.</li>
                        </ul>
                </div>

            </div>
        )}
        <div className="tier-task-item tier-vendor-task-item d-flex align-items-center gap-3 p-3 border rounded mb-2">
            {/* Index Number */}
            <div className="tier-index-box d-flex align-items-center justify-content-center bg-warning text-white rounded font-weight-bold">
                {index + 1}
            </div>

            {/* Logo */}
            <div className="tier-logo-box d-flex align-items-center justify-content-center">
                {logoSrc ? (
                    <img src={logoSrc} alt={task.title} className="img-fluid" />
                ) : (
                    <div className="text-muted small text-center fw-bold">{task.title.substring(0, 3).toUpperCase()}</div>
                )}
            </div>

            {/* Content */}
            <div className="task-details-col flex-grow-1">
                <div className="task-title fw-bold">
                    {task.title}
                </div>
                {task.subtitle && (
                    <div className="task-subtitle text-muted small mt-1">
                        {task.subtitle}
                    </div>
                )}
            </div>

            {/* Right Side Status & Actions */}
            <div className="task-action-col d-flex flex-column align-items-end justify-content-center">
                 <div className="text-primary small mb-1 text-end vendor-eligibility-text">
                    Vendor eligibility reviewed by FCH underwriting
                </div>
                
                <div className="d-flex align-items-center gap-2">
                     {/* View Details Link */}
                     <span 
                        className="text-primary cursor-pointer text-decoration-underline small"
                        onClick={() => setModalOpen(true)}
                        role="button"
                     >
                        View Instructions
                     </span>

                    {/* {isRejected ? (
                        <>
                            {renderStatusBadge()}
                            <UncontrolledTooltip placement="top" target={badgeId}>
                                {task.rejection_reason || "No reason provided."}
                            </UncontrolledTooltip>
                        </>
                    ) : (
                        renderStatusBadge()
                    )} */}
                </div>
            </div>
        </div>

        <TaskDetailsModal 
            isOpen={modalOpen} 
            toggle={() => setModalOpen(!modalOpen)} 
            task={task} 
            logoSrc={logoSrc}
        />
    </>
  )
}
