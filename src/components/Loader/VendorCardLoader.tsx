import React from 'react';

/**
 * Skeleton loader for vendor cards in the Credit Builder
 */
const VendorCardLoader = ({ count = 8 }) => {
    return (
        <div className="row g-4 mt-0 fade-panel">
            {Array.from({ length: count }).map((_, idx) => (
                <div key={idx} className="col-md-6 col-lg-4 col-xl-3">
                    <div className="card vendor-card-colorful mb-0 border-0 shadow-sm overflow-hidden bg-white mt-1" style={{ borderTop: '3px solid #f0f2f5' }}>

                        {/* Visual Header Skeleton */}
                        <div className="position-relative" style={{ height: '130px', backgroundColor: '#f9fafb' }}>
                            <div className="position-absolute top-0 end-0 m-3 z-1">
                                <div className="skeleton-line" style={{ width: '70px', height: '22px', borderRadius: '4px' }}></div>
                            </div>
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center p-4">
                                <div className="skeleton-line" style={{ width: '140px', height: '90px', borderRadius: '8px' }}></div>
                            </div>
                        </div>

                        <div className="card-body p-3 d-flex flex-column">
                            <div>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="skeleton-line" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
                                    <div className="skeleton-line" style={{ width: '100px', height: '10px' }}></div>
                                </div>
                                <div className="skeleton-line mb-2" style={{ width: '90%', height: '42px' }}></div>
                                <div className="skeleton-line mb-4" style={{ width: '80px', height: '18px', borderRadius: '2px' }}></div>

                                {/* Professional Metric Grid Skeleton - Exact match to card layout */}
                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <div className="p-2 border border-light rounded-1 bg-light bg-opacity-50" style={{ height: '50px' }}>
                                            <div className="skeleton-line mb-2" style={{ width: '40px', height: '8px' }}></div>
                                            <div className="skeleton-line" style={{ width: '60px', height: '14px' }}></div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-2 border border-light rounded-1 bg-light bg-opacity-50" style={{ height: '50px' }}>
                                            <div className="skeleton-line mb-2" style={{ width: '40px', height: '8px' }}></div>
                                            <div className="skeleton-line" style={{ width: '60px', height: '14px' }}></div>
                                        </div>
                                    </div>
                                    <div className="col-12 mt-2">
                                        <div className="p-2 border border-light rounded-1 d-flex justify-content-between align-items-center bg-light bg-opacity-50" style={{ height: '42px' }}>
                                            <div className="skeleton-line" style={{ width: '90px', height: '10px' }}></div>
                                            <div className="skeleton-line" style={{ width: '40px', height: '14px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2">
                                <div className="skeleton-line w-100" style={{ height: '34px', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VendorCardLoader;
