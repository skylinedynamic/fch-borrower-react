import { useEffect, useState } from 'react'

interface CardLogoProps {
  /** The card's logo URL (full_image_url); none or unloadable shows the placeholder. */
  src?: string | null
  /** The card's name, the image's alt text. */
  name: string
}

/**
 * A credit card's logo on a Credit Card Stacking play step. When there is no
 * logo, or the file cannot be loaded, it shows a neutral card placeholder
 * instead of the browser's broken image and alt text (BUG-148).
 */
export default function CardLogo({ src, name }: CardLogoProps) {
  const [failed, setFailed] = useState(false)

  // A new URL (another step, a re-uploaded logo) deserves a fresh attempt.
  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <div className="avatar-sm flex-shrink-0" data-testid="card-logo-placeholder">
        <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
          <i className="ri-bank-card-line" aria-hidden="true"></i>
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className="rounded border bg-white flex-shrink-0 ca-card-img-thumb"
      onError={() => setFailed(true)}
    />
  )
}
