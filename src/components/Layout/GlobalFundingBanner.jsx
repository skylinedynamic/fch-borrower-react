import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FUNDING_REVIEW_STATUS } from '../../config/funding';

export const BANNER_HEIGHT = 52; // px — approximate height of the banner

export default function GlobalFundingBanner({ activeRequest, count = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/fund-application')) return null;
  if (!activeRequest || count === 0) return null;

  const rawRange = activeRequest.estimated_funding_range || activeRequest.requested_amount;
  let estimatedRange = FUNDING_REVIEW_STATUS.PENDING;

  if (rawRange) {
    if (typeof rawRange === 'string' && (rawRange.includes('$') || rawRange.includes('-') || rawRange.includes('–'))) {
      estimatedRange = rawRange;
    } else {
      const num = Number(rawRange);
      estimatedRange = !isNaN(num) ? `$${num.toLocaleString()}` : rawRange;
    }
  }

  return (
    <div
      className="alert alert-success alert-solid fade show text-center rounded-0 mb-0 w-100"
      role="alert"
      style={{
        position: 'sticky',
        top: '70px',
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
              Estimated Funding: <strong>{estimatedRange}</strong> — Your application is ready.
            </span>
          )}
          {count > 1 && <span className="ms-sm-2">Your applications are ready to be processed.</span>}
        </div>
        <button
          onClick={() => navigate(`/fund-application/${activeRequest.id}`)}
          className="btn btn-light btn-sm fw-bold text-primary rounded-pill px-3 shadow-sm border-0 d-flex align-items-center"
        >
          Process Funding Application
          <i className="ri-arrow-right-line ms-1"></i>
        </button>
      </div>
    </div>
  );
}
