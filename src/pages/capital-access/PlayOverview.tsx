import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategy } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';



export default function PlayOverview() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading, isError } = useCapitalAccessStrategy(id);

  if (!isLoading && (isError || !play)) return <Navigate to="/capital-access/strategy" />;

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-22 mb-1 fw-bold text-dark">
                  {isLoading || !play ? 'Strategy Overview' : play.name}
                </h4>
                <p className="ca-page-subtitle">
                  Review the target exposure, approval probability, and benefits of this play.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <CapitalAccessLoader type="detail" />
          ) : (
            <div className="ca-card">

              {/* Header */}
              <div className="ca-card-header">
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-22">
                    <i className="ri-rocket-2-line"></i>
                  </span>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h4 className="fw-bold mb-1 fs-17">{play?.name}</h4>
                  <p className="text-muted fs-13 mb-0">{play?.description}</p>
                </div>
                {play?.isRecommended && (
                  <span className="ca-badge ca-badge-primary">
                    <i className="ri-star-fill"></i> Recommended For You
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
                        {play?.target_exposure}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="ca-metric">
                      <span className="ca-metric-label">Approval Probability</span>
                      <p className="ca-metric-value success mb-0">{play?.approval_probability}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="ca-metric">
                      <span className="ca-metric-label">Est. Timeline</span>
                      <p className="ca-metric-value mb-0">{play?.est_timeline}</p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                {play?.benefits && play.benefits.length > 0 && (
                  <>
                    <h6 className="fw-semibold fs-14 mb-3">What You'll Get</h6>
                    <div className="row g-2 mb-4">
                      {play.benefits.map((benefit: string, idx: number) => (
                        <div key={idx} className="col-12 mt-0">
                          <div className="d-flex align-items-start gap-2 p-2 rounded-3" style={{ background: 'var(--vz-secondary-bg)' }}>
                            <i className="ri-check-line fs-16 flex-shrink-0" style={{ color: 'var(--vz-success)' }}></i>
                            <span className="text-muted fs-13">{benefit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <hr className="ca-divider" />

                <div className="d-flex align-items-center justify-content-between gap-3 w-100">
                  <Link to="/capital-access/strategy" className="ca-btn ca-btn-outline flex-fill justify-content-center">
                    <i className="ri-arrow-left-line"></i> Back
                  </Link>
                  <Link to={`/capital-access/${play?.id}/pre-flight`} className="ca-btn ca-btn-primary flex-fill justify-content-center">
                    Start This Play <i className="ri-arrow-right-line"></i>
                  </Link>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
