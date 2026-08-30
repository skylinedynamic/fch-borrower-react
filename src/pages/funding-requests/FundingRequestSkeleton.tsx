import React from 'react';
import '../../../assets/css/funding-requests.css';

export default function FundingRequestSkeleton() {
    return (
        <div className="card shadow-none mb-0 fade-panel">
            <div className="row p-2">

                <div className="col-lg-12">
                    <div className="card-body p-4">
                        <div className="row g-3">
                            <div className="col-6">
                                <div className="skeleton-line mb-3 fr-skel-120"></div>
                                <div className="skeleton-line mb-1 fr-skel-200"></div>
                                <div className="skeleton-line mb-1 fr-skel-180"></div>
                                <div className="skeleton-line mb-1 fr-skel-160"></div>
                                <div className="skeleton-line fr-skel-140"></div>
                            </div>
                            <div className="col-6 text-end">
                                <div className="skeleton-line mb-3 ms-auto fr-skel-130"></div>
                                <div className="skeleton-line mb-2 ms-auto fr-skel-140h16"></div>
                                <div className="skeleton-line mb-1 ms-auto fr-skel-180"></div>
                                <div className="skeleton-line ms-auto fr-skel-150"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-12">
                    <div className="card-body p-4">
                        <div className="skeleton-line mb-3 fr-skel-full-40"></div>
                        <div className="skeleton-line mb-2 fr-skel-full-30"></div>
                        <div className="border-top border-top-dashed mt-4 pt-3">
                            <div className="skeleton-line mb-3 fr-skel-200h16"></div>
                            <div className="skeleton-line mb-2 fr-skel-full-40"></div>
                            <div className="skeleton-line mb-2 fr-skel-full-40"></div>
                            <div className="skeleton-line mb-2 fr-skel-full-40"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
