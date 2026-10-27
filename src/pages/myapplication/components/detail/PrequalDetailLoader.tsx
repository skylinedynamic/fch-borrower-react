import React from 'react'
import { HeroSkeleton, SectionSkeleton } from './Skeleton'

/** The prequalification dialog while it loads, in the dialog's own shape. */
export default function PrequalDetailLoader() {
  return (
    <div role="status" aria-label="Loading the prequalification">
      <HeroSkeleton facts={2} compact />
      <div className="ma-modal-content">
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={3} />
      </div>
    </div>
  )
}
