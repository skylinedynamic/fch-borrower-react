import React from 'react'

interface WelcomeHeaderProps {
  firstName: string
}

export default function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  return (
    <div className="ca-welcome-header">
      <h3 className="ca-welcome-title">
        Welcome back, {firstName}!
      </h3>
      <p className="ca-welcome-subtitle">Here's your funding overview.</p>
    </div>
  )
}
