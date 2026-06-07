import React from 'react';
import { Link } from 'react-router-dom';
import { mockPlays, formatCurrency } from './mockPlayData';
import './PremiumDesign.css';

export default function StrategySelection() {
  const recommendedPlay = mockPlays.find(p => p.isRecommended);
  const otherPlays = mockPlays.filter(p => !p.isRecommended);

  return (
    <div className="page-content">
      <div className="container-fluid">

        {/* ── Content ── */}
        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">Capital Access Strategy</h4>
                <p className="ca-page-subtitle">
                  Choose a strategy that fits your business funding goals. Each play is a structured sequence of card applications designed to maximize your credit access.
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Play */}
          {recommendedPlay && (
            <div className="mb-4">
              <span className="ca-section-label">⭐ Recommended For You</span>
              <div className="ca-hero-card">
                <div className="ca-hero-header">
                  <div className="d-flex align-items-center gap-3 flex-grow-1">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                        <i className="ri-rocket-2-line"></i>
                      </span>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-1 fs-17">{recommendedPlay.name}</h5>
                      <p className="text-muted fs-13 mb-0">{recommendedPlay.description}</p>
                    </div>
                  </div>
                  <span className="ca-badge ca-badge-primary ms-2 flex-shrink-0">
                    <i className="ri-star-fill"></i> Best Match
                  </span>
                </div>

                <div className="ca-card-body">
                  <div className="row g-3 mb-4">
                    <div className="col-sm-4">
                      <div className="ca-metric">
                        <span className="ca-metric-label">Target Exposure</span>
                        <p className="ca-metric-value primary mb-0" style={{ fontSize: '17px' }}>
                          {formatCurrency(recommendedPlay.target_exposure_min)}
                          <span className="text-muted fw-normal fs-12"> – {formatCurrency(recommendedPlay.target_exposure_max)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="ca-metric">
                        <span className="ca-metric-label">Approval Probability</span>
                        <p className="ca-metric-value success mb-0">{recommendedPlay.approval_probability}%</p>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="ca-metric">
                        <span className="ca-metric-label">Est. Timeline</span>
                        <p className="ca-metric-value mb-0">{recommendedPlay.est_timeline_min}–{recommendedPlay.est_timeline_max}<span className="text-muted fw-normal fs-13"> days</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end pt-2">
                    <Link to={`/credit-builder/strategy/${recommendedPlay.id}/overview`} className="ca-btn ca-btn-primary">
                      View Strategy <i className="ri-arrow-right-line"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Plays */}
          <div>
            <span className="ca-section-label">Other Eligible Plays</span>
            <div className="d-flex flex-column gap-2">
              {otherPlays.map(play => (
                <Link key={play.id} to={`/credit-builder/strategy/${play.id}/overview`} className="ca-strategy-row text-decoration-none">
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-light text-muted rounded-circle fs-18">
                        <i className="ri-flashlight-line"></i>
                      </span>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-semibold fs-14">{play.name}</h6>
                      <p className="text-muted fs-12 mb-0">{play.description}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <div className="d-none d-sm-block text-end">
                      <p className="ca-metric-label mb-1">Target</p>
                      <span className="fw-semibold fs-13">{formatCurrency(play.target_exposure_min)} – {formatCurrency(play.target_exposure_max)}</span>
                    </div>
                    <div className="d-none d-md-block text-end">
                      <p className="ca-metric-label mb-1">Approval</p>
                      <span className="fw-bold fs-13" style={{ color: 'var(--vz-success)' }}>{play.approval_probability}%</span>
                    </div>
                    <i className="ri-arrow-right-s-line fs-20 text-muted"></i>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
