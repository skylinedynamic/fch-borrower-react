import React from 'react'
import TierTask from './TierTask'
import { Tier } from '../../../modules/credit-builder/types'

interface TierAccordionProps {
  tier: Tier
  isOpen: boolean
  onToggle: () => void
}

export default function TierAccordion({ tier, isOpen, onToggle }: TierAccordionProps) {
  const completedCount = tier.tasks.filter(t => t.status === 'completed').length
  const totalCount = tier.tasks.length

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
          <span className="pill" style={{ backgroundColor: '#D4AF37' }}>
            {completedCount}/{totalCount}
          </span>
          <i className={`ri-arrow-down-s-line caret ${isOpen ? 'open' : ''}`}></i>
        </div>
      </div>
      <div className="tier-body">
        {tier.tasks.map((task) => (
          <TierTask key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
