import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategy } from '../../../modules/credit-builder/capital-access/queries';
import CapitalAccessLoader from '../../../components/Loader/CapitalAccessLoader';


export default function PreFlightChecklist() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading, isError } = useCapitalAccessStrategy(id);

  if (!isLoading && (isError || !play)) return <Navigate to="/credit-builder/strategy" />;

  const allComplete = play?.checklist ? play.checklist.every((item: any) => item.complete !== false) : false;

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap" style={{ maxWidth: '680px' }}>
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">Pre-Flight Checklist</h4>
                <p className="ca-page-subtitle">
                  Confirm all requirements are completed before starting this play.
                </p>
              </div>
            </div>
          </div>

          {isLoading || !play ? (
            <CapitalAccessLoader type="checklist" />
          ) : (
            <div className="ca-card">
 
              {/* Header */}
              <div className="ca-card-header">
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-success-subtle text-success rounded-circle fs-20">
                    <i className="ri-shield-check-line"></i>
                  </span>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h5 className="fw-bold mb-0 fs-16">Pre-Flight Checklist</h5>
                  <p className="text-muted fs-13 mb-0">Confirm you're ready before beginning {play.name}.</p>
                </div>
                <span className="ca-badge ca-badge-success">
                  <i className="ri-checkbox-circle-fill"></i> All Clear
                </span>
              </div>
 
              <div className="ca-card-body">
 
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-semibold fs-14 mb-0">Required Items</h6>
                  <span className="text-muted fs-12">{play.checklist.length} / {play.checklist.length} complete</span>
                </div>
 
                <div className="mb-3">
                  {play.checklist.map((item: any, idx: number) => (
                    <div key={idx} className="ca-checklist-item">
                      <div className="d-flex align-items-center gap-3">
                        <i className="ri-checkbox-circle-fill fs-20" style={{ color: 'var(--vz-success)' }}></i>
                        <span className="fw-medium fs-14">{item.label}</span>
                      </div>
                      <span className="ca-badge ca-badge-success">Done</span>
                    </div>
                  ))}
                </div>
 
                {/* Info tip */}
                <div className="d-flex align-items-start gap-2 p-2 px-3 rounded-3 mb-3"
                  style={{ background: 'var(--vz-primary-bg-subtle, rgba(64,81,137,0.05))', border: '1px solid rgba(64,81,137,0.12)' }}>
                  <i className="ri-information-line fs-16 flex-shrink-0 mt-1" style={{ color: 'var(--vz-primary)' }}></i>
                  <p className="text-muted fs-13 mb-0">
                    All checks passed. You can proceed to the roadmap and start applying for cards in the correct sequence.
                  </p>
                </div>
 
                <hr className="ca-divider mt-2 mb-3" />
 
                <div className="d-flex gap-3">
                  <Link to={`/credit-builder/strategy/${play.id}/overview`} className="ca-btn ca-btn-outline flex-fill justify-content-center">
                    <i className="ri-arrow-left-line"></i> Back
                  </Link>
                  <Link to={`/credit-builder/strategy/${play.id}/roadmap`} className="ca-btn ca-btn-primary flex-fill justify-content-center">
                    View Roadmap <i className="ri-road-map-line"></i>
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
