import React from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'

export interface TierTaskProps {
  task: TierTaskType
  isCurrentTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
}

export default function TierTask({ task, isCurrentTier, onTaskClick }: TierTaskProps) {
  const isDone = task.status === CREDIT_BUILDER_STATUS.COMPLETED
  const isPending = task.status === CREDIT_BUILDER_STATUS.PENDING

  // Checkbox logic:
  // - If Done: Checked (always visible)
  // - If Pending & Current Tier: Checkbox visible & interactive
  // - If Pending & Not Current: Checkbox hidden
  const showCheckbox = isDone || (isPending && isCurrentTier)

  return (
    <div className={`task ${isDone ? 'done' : 'pending'}`}>
      <div className="left">
        <div className="title-row">
          {showCheckbox && (
            <span 
              className={`check ${isDone ? 'checked' : ''} ${!isDone ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (!isDone && onTaskClick) {
                  onTaskClick(task)
                }
              }}
            >
              {isDone ? (
                <i className="ri-check-line"></i>
              ) : (
                <div className="check-box-unchecked"></div>
              )}
            </span>
          )}
          {!showCheckbox && (
            <span className="check d-none"></span>
          )}
          <div className="title">{task.title}</div>
        </div>
        {task.subtitle && <div className="desc">{task.subtitle}</div>}
        <div className="meta">
          {isDone ? (
            <>Completed {task.completed_at && ` | ${task.completed_at}`}</>
          ) : (
            'Pending'
          )}
          {task.estimated_completion_days && (
            <span className="ms-1">| {task.estimated_completion_days}</span>
          )}
        </div>
      </div>
      {task.button_title && (
        <div className="cta">
          <a 
            href={task.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn ${isDone ? 'btn-outline-success' : 'btn-outline-primary'} btn-sm`}
          >
            {task.button_title}
          </a>
        </div>
      )}
    </div>
  )
}
