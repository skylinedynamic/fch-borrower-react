import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { mockPlays, formatCurrency } from './mockPlayData';
import './PremiumDesign.css';

export default function PlayOverview() {
  const { id } = useParams<{ id: string }>();
  const play = mockPlays.find(p => p.id === id);

  if (!play) return <Navigate to="/credit-builder/strategy" />;

  return (
    <div className="page-content">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">{play.name}</h4>
                <p className="ca-page-subtitle">
                  Review the program target exposure, probability of approval, and total timeline.
                </p>
              </div>
            </div>
          </div>

          <div className="ca-card">

            {/* Header */}
            <div className="ca-card-header">
              <div className="avatar-sm flex-shrink-0">
                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-22">
                  <i className="ri-rocket-2-line"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <h4 className="fw-bold mb-1 fs-17">{play.name}</h4>
                <p className="text-muted fs-13 mb-0">{play.description}</p>
              </div>
              {play.isRecommended && (
                <span className="ca-badge ca-badge-primary">
                  <i className="ri-star-fill"></i> Recommended
                </span>
              )}
            </div>

            <div className="ca-card-body">

              {/* Key Metrics */}
              <div className="row g-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--vz-border-color)' }}>
                <div className="col-md-4">
                  <div className="ca-metric">
                    <span className="ca-metric-label">Target Exposure</span>
                    <p className="ca-metric-value primary mb-0" style={{ fontSize: '18px' }}>
                      {formatCurrency(play.target_exposure_min)}
                    </p>
                    <p className="text-muted fs-12 mb-0">to {formatCurrency(play.target_exposure_max)}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="ca-metric">
                    <span className="ca-metric-label">Approval Probability</span>
                    <p className="ca-metric-value success mb-0">{play.approval_probability}%</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="ca-metric">
                    <span className="ca-metric-label">Est. Timeline</span>
                    <p className="ca-metric-value mb-0">
                      {play.est_timeline_min}–{play.est_timeline_max}
                      <span className="text-muted fw-normal fs-13"> days</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <h6 className="fw-semibold fs-14 mb-3">What You'll Get</h6>
              <div className="row g-2 mb-4">
                {play.benefits.map((benefit: string, idx: number) => (
                  <div key={idx} className="col-md-6">
                    <div className="d-flex align-items-start gap-2 p-2 rounded-3" style={{ background: 'var(--vz-secondary-bg)' }}>
                      <i className="ri-check-line fs-16 flex-shrink-0 mt-1" style={{ color: 'var(--vz-success)' }}></i>
                      <span className="text-muted fs-13">{benefit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="ca-divider" />

              <div className="d-flex align-items-center justify-content-between">
                <Link to="/credit-builder/strategy" className="ca-btn ca-btn-outline">
                  <i className="ri-arrow-left-line"></i> Back
                </Link>
                <Link to={`/credit-builder/strategy/${play.id}/pre-flight`} className="ca-btn ca-btn-primary">
                  Start This Play <i className="ri-arrow-right-line"></i>
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
