import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FUNDING_REVIEW_STATUS } from '../../config/funding';

export const BANNER_HEIGHT = 52; // fallback height

export default function GlobalFundingBanner({ activeRequest, count = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerRef = useRef(null);
  const [currentHeight, setCurrentHeight] = useState(BANNER_HEIGHT);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  useEffect(() => {
    if (bannerRef.current) {
      setCurrentHeight(bannerRef.current.offsetHeight);
    }
    // Also handle window resize
    const handleResize = () => {
      if (bannerRef.current) {
        setCurrentHeight(bannerRef.current.offsetHeight);
      }
      setIsMobile(window.innerWidth <= 991);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeRequest, count]);

  if (location.pathname.startsWith('/fund-application')) return null;
  if (!activeRequest || count === 0) return null;

  const estimatedRange = activeRequest.estimated_funding_range || activeRequest.requested_amount || FUNDING_REVIEW_STATUS.PENDING;

  return (
    <>
      <div
        ref={bannerRef}
        className="alert alert-success alert-solid fade show text-center rounded-0 mb-0 w-100"
        role="alert"
        style={{
          position: 'fixed',
          top: '70px',
          left: isMobile ? 0 : 'var(--vz-vertical-menu-width, 250px)',
          right: 0,
          zIndex: 999,
          margin: 0,
        }}
      >
        <div className="d-flex align-items-center justify-content-center flex-column flex-sm-row gap-3 py-2">
          <div>
            <strong>🎉 {count > 1 ? `You have ${count} Funding Requests Approved!` : 'Your Funding Request has been Approved!'}</strong>
            <br className="d-sm-none" />
            {count === 1 && (
              <span className="ms-sm-2">
                Estimated Funding: <strong>{estimatedRange}</strong> — You’re ready to start your application.
              </span>
            )}
            {count > 1 && <span className="ms-sm-2">You’re ready to start your applications.</span>}
          </div>
          <button
            onClick={() => navigate(`/fund-application/${activeRequest.id}`)}
            className="btn btn-light btn-sm fw-bold text-primary rounded-pill px-3 shadow-sm border-0 d-flex align-items-center"
          >
            Start Funding Application
            <i className="ri-arrow-right-line ms-1"></i>
          </button>
        </div>
      </div>
      {/* Dynamic spacer to push page content down without overlapping breadcrumbs */}
      <div style={{ height: `${currentHeight}px`, flexShrink: 0, width: '100%' }} aria-hidden="true" />
    </>
  );
}
