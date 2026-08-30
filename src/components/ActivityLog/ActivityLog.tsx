import React from 'react'

export interface ActivityItem {
  id?: string | number
  title: string
  desc: string
  meta: string
  icon: string
  iconColorClass: string 
  dotColor: string 
}

interface ActivityLogProps {
  activities?: ActivityItem[]
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  const defaultActivities: ActivityItem[] = [
    {
      title: 'Business Bank Account Opened',
      desc: 'Successfully opened account with Chase Business',
      meta: '1 day ago',
      icon: 'ri-user-3-line',
      iconColorClass: 'text-info',
      dotColor: '#c9f3ec',
    },
    {
      title: 'Vendor Application Approved',
      desc: 'Approved for $500 credit line with Uline',
      meta: '3 days ago',
      icon: 'ri-heart-2-line',
      iconColorClass: 'text-danger',
      dotColor: '#ffe5e0',
    },
    {
      title: 'Credit Report Monitoring',
      desc: 'Waiting for first credit report update',
      meta: '1 week ago',
      icon: 'ri-time-line',
      iconColorClass: 'text-primary',
      dotColor: '#f3e6ff',
    },
    {
      title: 'Credit Report Monitoring',
      desc: 'Waiting for first credit report update',
      meta: '1 week ago',
      icon: 'ri-time-line',
      iconColorClass: 'text-primary',
      dotColor: '#f3e6ff',
    },
  ]

  const items = activities || defaultActivities

  return (
    <div className="card mb-3 activity-log-component">
      <div className="card-header">
        <h6 className="mb-0">Recent Activity</h6>
      </div>
      <div className="card-body">
        <div className="timeline">
          {items.map((item, index) => (
            <div className="item" key={index}>
              <span className="dot" style={{ background: item.dotColor }}>
                <span className="inner"></span>
                <i className={`${item.icon} icon ${item.iconColorClass}`}></i>
              </span>
              <div className="title">{item.title}</div>
              <div className="desc">{item.desc}</div>
              <div className="meta text-muted">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
