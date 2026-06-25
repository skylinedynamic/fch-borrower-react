import React from 'react';

export default function FundingRequestSkeleton() {
    return (
        <div className="card shadow-none mb-0 fade-panel">
            <div className="row p-2">

                <div className="col-lg-12">
                    <div className="card-body p-4">
                        <div className="row g-3">
                            <div className="col-6">
                                <div className="skeleton-line mb-3" style={{ width: '120px', height: '14px' }}></div>
                                <div className="skeleton-line mb-1" style={{ width: '200px', height: '14px' }}></div>
                                <div className="skeleton-line mb-1" style={{ width: '180px', height: '14px' }}></div>
                                <div className="skeleton-line mb-1" style={{ width: '160px', height: '14px' }}></div>
                                <div className="skeleton-line" style={{ width: '140px', height: '14px' }}></div>
                            </div>
                            <div className="col-6 text-end">
                                <div className="skeleton-line mb-3 ms-auto" style={{ width: '130px', height: '14px' }}></div>
                                <div className="skeleton-line mb-2 ms-auto" style={{ width: '140px', height: '16px' }}></div>
                                <div className="skeleton-line mb-1 ms-auto" style={{ width: '180px', height: '14px' }}></div>
                                <div className="skeleton-line ms-auto" style={{ width: '150px', height: '14px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-12">
                    <div className="card-body p-4">
                        <div className="skeleton-line mb-3" style={{ width: '100%', height: '40px' }}></div>
                        <div className="skeleton-line mb-2" style={{ width: '100%', height: '30px' }}></div>
                        <div className="border-top border-top-dashed mt-4 pt-3">
                            <div className="skeleton-line mb-3" style={{ width: '200px', height: '16px' }}></div>
                            <div className="skeleton-line mb-2" style={{ width: '100%', height: '40px' }}></div>
                            <div className="skeleton-line mb-2" style={{ width: '100%', height: '40px' }}></div>
                            <div className="skeleton-line mb-2" style={{ width: '100%', height: '40px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
