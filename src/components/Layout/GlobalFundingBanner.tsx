import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FUNDING_REVIEW_STATUS } from '../../config/funding'
import type { ActiveFundingRequest } from '../../modules/dashboard/types'
import './GlobalFundingBanner.css'

export const BANNER_HEIGHT = 52 // fallback height

interface GlobalFundingBannerProps {
  activeRequest: ActiveFundingRequest | null | undefined
  count?: number
}

/**
 * Under the topbar on every page while an approved funding request waits for
 * its funding application. A solid, coloured strip with its own headline, so
 * the borrower can't miss it.
 */
export default function GlobalFundingBanner({ activeRequest, count = 0 }: GlobalFundingBannerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const bannerRef = useRef<HTMLDivElement>(null)
  const [currentHeight, setCurrentHeight] = useState(BANNER_HEIGHT)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991)

  useEffect(() => {
    if (bannerRef.current) {
      setCurrentHeight(bannerRef.current.offsetHeight)
    }
    // Also handle window resize
    const handleResize = () => {
      if (bannerRef.current) {
        setCurrentHeight(bannerRef.current.offsetHeight)
      }
      setIsMobile(window.innerWidth <= 991)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeRequest, count])

  if (location.pathname.startsWith('/fund-application')) return null
  if (!activeRequest || count === 0) return null

  const estimatedRange = activeRequest.estimated_funding_range || activeRequest.requested_amount || FUNDING_REVIEW_STATUS.PENDING

  return (
    <>
      <div
        ref={bannerRef}
        className="gfb"
        role="alert"
        style={{ left: isMobile ? 0 : 'var(--vz-vertical-menu-width, 250px)' }}
      >
        <div className="gfb-inner">
          <span className="gfb-icon" aria-hidden="true">
            <i className="ri-trophy-line"></i>
          </span>
          <div className="gfb-text">
            <strong className="gfb-title">
              {count > 1 ? `You have ${count} Funding Requests Approved!` : 'Your Funding Request has been Approved!'}
            </strong>
            {count === 1 ? (
              <span className="gfb-sub">
                Estimated Funding: <strong>{estimatedRange}</strong> — You’re ready to start your application.
              </span>
            ) : (
              <span className="gfb-sub">You’re ready to start your applications.</span>
            )}
          </div>
          <button type="button" className="gfb-btn" onClick={() => navigate(`/fund-application/${activeRequest.id}`)}>
            Start Funding Application
            <i className="ri-arrow-right-line" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      {/* Dynamic spacer to push page content down without overlapping breadcrumbs */}
      <div style={{ height: `${currentHeight}px`, flexShrink: 0, width: '100%' }} aria-hidden="true" />
    </>
  )
}
