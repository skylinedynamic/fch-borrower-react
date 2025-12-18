import React from 'react'
import TierTask from './TierTask'
import { Tier, TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'

interface TierAccordionProps {
  tier: Tier
  isOpen: boolean
  onToggle: () => void
  isCurrentTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onCompleteTier?: (tier: Tier) => void
}

export default function TierAccordion({ tier, isOpen, onToggle, isCurrentTier, onTaskClick, onCompleteTier }: TierAccordionProps) {
  const completedCount = tier.tasks.filter(t => t.status === CREDIT_BUILDER_STATUS.COMPLETED).length
  const totalCount = tier.tasks.length
  const isTierComplete = completedCount === totalCount && totalCount > 0

  return (
    <div className={`tier mt-3 ${isOpen ? 'open' : ''}`}>
      <div className="tier-head" onClick={onToggle}>
        <div className="tier-info">
          <div className="tier-title">
            {tier.name}: {tier.title}
            {tier.subtitle && (
              <span 
                className="ms-1" 
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                data-bs-html="true" 
                data-bs-custom-class="tooltip-info" 
                title={`<div class='tt-title'>Why it matters</div><div class='tt-body'>${tier.subtitle}</div>`}
              >
                <i className="ri-information-fill align-middle text-white" style={{ fontSize: 20 }}></i>
              </span>
            )}
          </div>
          <div className="tier-desc">{tier.description}</div>
        </div>
        <div className="tier-meta">
          {isTierComplete && (
            <button 
              className="btn btn-sm btn-success me-2"
              onClick={(e) => {
                e.stopPropagation()
                onCompleteTier?.(tier)
              }}
            >
              Complete Tier
            </button>
          )}
          <span className="pill" style={{ backgroundColor: '#D4AF37' }}>
            {completedCount}/{totalCount}
          </span>
          <i className={`ri-arrow-down-s-line caret ${isOpen ? 'open' : ''}`}></i>
        </div>
      </div>
      <div className="tier-body-wrapper">
        <div className="tier-body">
          <div className="tier-inner-content">
            {tier.tasks.map((task) => (
              <TierTask 
                key={task.id} 
                task={task} 
                isCurrentTier={isCurrentTier}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
