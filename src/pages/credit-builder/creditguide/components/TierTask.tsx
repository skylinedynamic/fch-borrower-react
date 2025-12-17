import React from 'react'
import { TierTask as TierTaskType } from '../../../modules/credit-builder/types'

interface TierTaskProps {
  task: TierTaskType
}

export default function TierTask({ task }: TierTaskProps) {
  const isDone = task.status === 'completed'
  
  return (
    <div className={`task ${isDone ? 'done' : 'pending'}`}>
      <div className="left">
        <div className="title-row">
          <span className="check">
            <i className="ri-check-line"></i>
          </span>
          <div className="title">{task.title}</div>
        </div>
        {task.subtitle && <div className="desc">{task.subtitle}</div>}
        <div className="desc">{task.description}</div>
        <div className="meta">{isDone ? 'Completed' : 'Pending'}</div>
      </div>
      {task.button_title && task.url && (
        <div className="cta">
          <a 
            href={task.url}
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
