import React from 'react'
import '../../../../components/Common/StatisticsCardSkeleton.css'

/** A shimmering placeholder block. */
export default function Skeleton({ w, h, round = false, className = '' }: { w: number | string; h: number; round?: boolean; className?: string }) {
  return <span className={`skeleton-shimmer d-block ${round ? 'rounded-circle' : ''} ${className}`} style={{ width: w, height: h }}></span>
}

/** A section card's placeholder: header, then label/value rows in two columns. */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="ma-card ma-detail-section">
      <div className="ma-card-head">
        <Skeleton w={38} h={38} />
        <Skeleton w={180} h={16} />
      </div>
      <div className="ma-fields">
        {Array.from({ length: rows * 2 }).map((_, i) => (
          <div key={i} className="ma-field">
            <Skeleton w={90} h={10} className="mb-2" />
            <Skeleton w={`${50 + ((i * 17) % 40)}%`} h={14} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** The hero's placeholder, drawn in light shimmer on the brand colour. */
export function HeroSkeleton({ facts = 4, compact = false }: { facts?: number; compact?: boolean }) {
  return (
    <div className={`ma-hero ma-detail-hero ${compact ? 'is-compact' : ''}`}>
      <div className="min-w-0">
        <Skeleton w={200} h={12} className="mb-3" />
        <Skeleton w="70%" h={28} className="mb-2" />
        <Skeleton w="45%" h={14} className="mb-3" />
        <div className="ma-detail-actions">
          <Skeleton w={170} h={34} />
          {!compact && <Skeleton w={140} h={40} />}
        </div>
      </div>
      <div className="ma-facts">
        {Array.from({ length: facts }).map((_, i) => (
          <div key={i} className="ma-stat ma-fact">
            <span className="ma-tile-head">
              <Skeleton w={34} h={34} />
              <Skeleton w={100} h={11} />
            </span>
            <Skeleton w={120} h={22} />
          </div>
        ))}
      </div>
    </div>
  )
}
