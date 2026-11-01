import React from 'react'

type ProgressRingProps = {
  /** 0-100. */
  value: number
  /** Accessible name, e.g. "Overall progress". */
  label: string
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
}

/** A circular progress meter: a track, an arc filled to `value`, and whatever is passed in the middle. */
export default function ProgressRing({ value, label, size = 120, stroke = 10, className = '', children }: ProgressRingProps) {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className={`co-ring ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="co-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="co-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="co-ring-center">{children}</div>
    </div>
  )
}
