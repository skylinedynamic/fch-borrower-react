import { useEffect, useState, type CSSProperties } from 'react'

interface BrandLogoProps {
  src: string
  /** Shown instead of the image when it fails to load - the tenant's own name. */
  fallbackText?: string | null
  height?: string | number
  style?: CSSProperties
  className?: string
}

/**
 * A tenant logo that degrades to the tenant's name when the file can't be
 * loaded (deleted upload, 403, storage outage). It never falls back to the
 * packaged host logo: on a white-label portal that would show another
 * company's mark (see utils/brandLogo.ts).
 */
export default function BrandLogo({ src, fallbackText, height, style, className }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)

  // A new URL (branding refreshed, logo re-uploaded) deserves a fresh attempt.
  useEffect(() => setFailed(false), [src])

  if (failed) {
    return fallbackText ? <span className="brand-logo-text fw-semibold text-truncate d-inline-block">{fallbackText}</span> : null
  }

  return <img src={src} alt={fallbackText || ''} height={height} style={style} className={className} onError={() => setFailed(true)} />
}
