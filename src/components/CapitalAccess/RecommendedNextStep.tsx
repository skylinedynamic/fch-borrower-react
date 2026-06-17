import React from 'react'
import { Link } from 'react-router-dom'

export default function RecommendedNextStep() {
  return (
    <div className="ca-next-step-card">
      <div className="ca-next-step-content">
        <h6 className="ca-next-step-label">
          Recommended Next Step
        </h6>
        <p className="ca-next-step-desc">
          Select your Capital Access Strategy to begin.
        </p>
      </div>
      <Link
        to="/capital-access/strategy"
        className="ca-btn ca-btn-primary"
      >
        Choose Your Strategy <i className="ri-arrow-right-line"></i>
      </Link>
    </div>
  )
}
