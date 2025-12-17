import React from 'react'

export interface ActionItem {
  id?: string | number
  title: string
  subtitle: string
  icon: string
  iconBgColor?: string
  iconColor?: string
  priority: 'high' | 'medium' | 'low'
  onStart?: () => void
}

interface RecommendedActionsProps {
  actions?: ActionItem[]
  title?: string
}

const defaultActions: ActionItem[] = [
  {
    id: 1,
    title: 'Apply to Tier 2 Vendors',
    subtitle: 'Ready to apply to 3 new credit-buil vendors',
    icon: 'ri-hand-heart-line',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Set Up Business Phone',
    subtitle: 'Establish a dedicated business phone line',
    icon: 'ri-phone-line',
    iconBgColor: '#eaf2ff',
    iconColor: '#0b5ed7',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Update 411 Directory',
    subtitle: 'Ensure your business listing is current',
    icon: 'ri-book-2-line',
    iconBgColor: '#f3e6ff',
    iconColor: '#6f42c1',
    priority: 'medium'
  }
]

export default function RecommendedActions({ actions, title = 'Recommended Actions' }: RecommendedActionsProps) {
  const items = actions || defaultActions

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high'
      case 'medium': return 'priority-medium'
      case 'low': return 'priority-low'
      default: return 'priority-medium'
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">{title}</h6>
      </div>
      <div className="card-body">
        <div className="actions-list">
          {items.map((action, index) => (
            <div className="action-item" key={action.id || index}>
              <div className="action-top">
                <div 
                  className="action-icon"
                  style={action.iconBgColor && action.iconColor ? {
                    background: action.iconBgColor,
                    color: action.iconColor
                  } : undefined}
                >
                  <i className={action.icon}></i>
                </div>
                <div className="action-title">{action.title}</div>
              </div>
              <div className="action-bottom">
                <div>
                  <div className="action-sub">{action.subtitle}</div>
                </div>
              </div>
              <div className="action-cta">
                <span className={`priority ${getPriorityClass(action.priority)}`}>
                  {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)} Priority
                </span>
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary btn-start"
                  onClick={action.onStart}
                >
                  Start Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
