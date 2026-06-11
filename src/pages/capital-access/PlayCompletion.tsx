import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { formatCurrency } from './mockPlayData';


export default function PlayCompletion() {
  const location = useLocation();

  if (!location.state || !location.state.play) {
    return <Navigate to="/credit-builder/strategy" />;
  }

  const { play } = location.state;

  const totalExposure = play.roadmap
    .filter((s: any) => s.status === 'Completed' && s.result?.status === 'Approved' && s.result?.limit)
    .reduce((sum: number, s: any) => sum + (s.result?.limit || 0), 0);

  const totalCards = play.roadmap
    .filter((s: any) => s.status === 'Completed' && s.result?.status === 'Approved')
    .length;

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">Play Completed!</h4>
                <p className="ca-page-subtitle">
                  Review the final summary of your business credit build play results.
                </p>
              </div>
            </div>
          </div>

          <div className="ca-card text-center">
            <div className="ca-card-body" style={{ padding: '48px 40px' }}>

              {/* Animated icon */}
              <div className="ca-completion-icon">
                <i className="ri-medal-2-fill"></i>
              </div>

              <h3 className="fw-bold mb-2 fs-22">Congratulations!</h3>
              <p className="text-muted fs-14 mb-4">
                You've successfully completed <strong style={{ color: 'var(--vz-heading-color)' }}>{play.name}</strong>.<br />
                Here's a summary of what you achieved.
              </p>

              <hr className="ca-divider" />

              {/* Stats */}
              <div className="row g-3 mb-4">
                <div className="col-4">
                  <div className="ca-metric">
                    <span className="ca-metric-label">Credit Secured</span>
                    <p className="ca-metric-value success mb-0" style={{ fontSize: '19px' }}>
                      {formatCurrency(totalExposure)}
                    </p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="ca-metric">
                    <span className="ca-metric-label">Cards Approved</span>
                    <p className="ca-metric-value mb-0">{totalCards}</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="ca-metric">
                    <span className="ca-metric-label">Days Taken</span>
                    <p className="ca-metric-value mb-0">8</p>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4 text-start"
                style={{ background: 'rgba(10, 179, 156, 0.06)', border: '1px solid rgba(10, 179, 156, 0.2)' }}>
                <i className="ri-lightbulb-flash-line fs-18 flex-shrink-0" style={{ color: 'var(--vz-success)' }}></i>
                <p className="fs-13 mb-0 text-muted text-start">
                  <strong style={{ color: 'var(--vz-heading-color)' }}>Pro Tip:</strong> Keep credit utilization below 10% and avoid new applications for 90 days to maximize your score gains.
                </p>
              </div>

              {/* Actions */}
              <div className="d-flex gap-3 justify-content-center">
                <Link to={`/credit-builder/strategy/${play.id}/roadmap`} className="ca-btn ca-btn-outline">
                  <i className="ri-road-map-line"></i> View Roadmap
                </Link>
                <Link to="/credit-builder/strategy" className="ca-btn ca-btn-primary">
                  Next Play <i className="ri-arrow-right-line"></i>
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
