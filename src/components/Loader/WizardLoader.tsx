import React from 'react';
import { Link } from 'react-router-dom';

const WizardLoader = () => {
    return (
        <div className="page-content" style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <div className="container-fluid">
                
                {/* ── Breadcrumb Skeleton ─────────────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Review</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding">Funding Options</Link></li>
                                        <li className="breadcrumb-item active fw-medium" aria-current="page">Funding Review</li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="mt-0">
                                <div className="skeleton-line d-inline-block m-0" style={{ width: '75px', height: '36px', borderRadius: '6px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto" style={{ maxWidth: '800px' }}>

                {/* Stepper Header Skeleton */}
                <div className="d-flex justify-content-center mb-5 pt-4">
                    <div className="d-flex align-items-center position-relative w-100" style={{ maxWidth: '600px' }}>
                        <div className="position-absolute" style={{ top: '50%', left: 0, right: 0, height: '2px', backgroundColor: '#e5e7eb', zIndex: 0, transform: 'translateY(-50%)' }}></div>
                        {[1, 2, 3, 4].map((step, index) => {
                            const isActive = index === 0;
                            return (
                                <React.Fragment key={step}>
                                    {index !== 0 && (
                                        <div style={{ flex: 1, height: '2px', backgroundColor: 'transparent', zIndex: 1 }}></div>
                                    )}
                                    <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, background: '#f9fafb', padding: '0 10px' }}>
                                        <div
                                            className="skeleton-line rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: isActive ? '40px' : '32px',
                                                height: isActive ? '40px' : '32px',
                                                boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none',
                                            }}
                                        ></div>
                                        <div
                                            className="skeleton-line mt-2 position-absolute"
                                            style={{ top: '42px', width: 60, height: 12, borderRadius: 4 }}
                                        ></div>
                                    </div>
                                    {index !== 3 && (
                                        <div style={{ flex: 1, height: '2px', backgroundColor: 'transparent', zIndex: 1 }}></div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Card Content Skeleton */}
                <div className="card shadow-sm border-0 mt-5" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card-body p-5">
                        <div>
                            <div className="skeleton-line mb-2" style={{ width: 250, height: 28, borderRadius: 6 }} />
                            <div className="skeleton-line mb-4" style={{ width: 180, height: 16, borderRadius: 4 }} />

                            {/* Info Box Skeleton */}
                            <div className="border rounded-3 p-4 mb-4 bg-white shadow-sm">
                                <div className="row mb-4">
                                    <div className="col-12 mb-3">
                                        <div className="skeleton-line mb-2" style={{ width: 100, height: 12, borderRadius: 4 }} />
                                        <div className="skeleton-line" style={{ width: 180, height: 20, borderRadius: 4 }} />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <div className="skeleton-line mb-2" style={{ width: 140, height: 12, borderRadius: 4 }} />
                                        <div className="skeleton-line" style={{ width: 120, height: 20, borderRadius: 4 }} />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                        <div className="skeleton-line mb-2" style={{ width: 120, height: 12, borderRadius: 4 }} />
                                        <div className="skeleton-line" style={{ width: 90, height: 20, borderRadius: 4 }} />
                                    </div>
                                    <div className="col-md-6">
                                        <div className="skeleton-line mb-2" style={{ width: 90, height: 12, borderRadius: 4 }} />
                                        <div className="skeleton-line" style={{ width: 110, height: 20, borderRadius: 4 }} />
                                    </div>
                                </div>
                            </div>

                            {/* Inputs Row Skeleton */}
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <div className="skeleton-line mb-2" style={{ width: 110, height: 14, borderRadius: 4 }} />
                                    <div className="skeleton-line" style={{ width: '100%', height: 40, borderRadius: 6 }} />
                                </div>
                                <div className="col-md-6">
                                    <div className="skeleton-line mb-2" style={{ width: 90, height: 14, borderRadius: 4 }} />
                                    <div className="skeleton-line" style={{ width: '100%', height: 40, borderRadius: 6 }} />
                                </div>
                            </div>

                            {/* Alert Skeleton */}
                            <div className="skeleton-line" style={{ width: '100%', height: 50, borderRadius: '8px' }} />
                        </div>
                    </div>
                </div>
                </div>

            </div>
        </div>
    );
};

export default WizardLoader;
