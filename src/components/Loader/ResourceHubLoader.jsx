import React from 'react';

const ResourceHubLoader = () => {
    return (
        <>
            {/* Metric Header Skeleton - Matching row g-3 */}
            <div className="row g-3">
                {[1, 2, 3, 4].map((_, i) => (
                    <div className="col-md-3" key={i}>
                        <div className="card shadow-sm border-0 rounded-2 bg-white dashboard-card">
                            <div className="card-body py-3 px-4 d-flex align-items-center">
                                <div className="avatar-md rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0 skeleton-rect sk-metric-rect"></div>
                                <div>
                                    <div className="skeleton-line mb-2 sk-metric-title"></div>
                                    <div className="skeleton-line sk-metric-val"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-3">
                <div className="col-lg-8">
                    <div className="row g-3">

                        {/* Category Sections Skeleton - Matching col-md-6 row g-3 */}
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 rounded-2 h-100 bg-white">
                                <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
                                    <div className="skeleton-line sk-cat-header"></div>
                                </div>
                                <div className="card-body p-3 pt-2">
                                    <div className="d-flex flex-column gap-3">
                                        {[1, 2, 3, 4].map((_, i) => (
                                            <div className="p-3 rounded-2 border border-light-subtle d-flex align-items-center luxe-item" key={i}>
                                                <div className="flex-shrink-0 avatar-xs rounded d-flex align-items-center justify-content-center me-3 skeleton-rect sk-item-icon"></div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="skeleton-line mb-1 sk-item-title"></div>
                                                    <div className="skeleton-line sk-item-sub"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center mt-3 pt-2 border-top border-light-subtle">
                                        <div className="skeleton-line mx-auto sk-view-more"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 rounded-2 h-100 bg-white">
                                <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex align-items-center justify-content-between">
                                    <div className="skeleton-line sk-cat-header"></div>
                                </div>
                                <div className="card-body p-3 pt-2">
                                    <div className="d-flex flex-column gap-3">
                                        {[1, 2, 3, 4].map((_, i) => (
                                            <div className="p-3 rounded-2 border border-light-subtle d-flex align-items-center luxe-item" key={i}>
                                                <div className="flex-shrink-0 avatar-xs rounded d-flex align-items-center justify-content-center me-3 skeleton-rect sk-item-icon"></div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="skeleton-line mb-1 sk-item-title"></div>
                                                    <div className="skeleton-line sk-item-sub"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center mt-3 pt-2 border-top border-light-subtle">
                                        <div className="skeleton-line mx-auto sk-view-more"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Education Library Skeleton - Matching col-12 p-3 */}
                        <div className="col-12">
                            <div className="card shadow-sm border-0 rounded-2 bg-white overflow-hidden">
                                <div className="card-header border-0 p-3 edu-card-header">
                                    <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-4">
                                        <div className="flex-grow-1">
                                            <div className="skeleton-line mb-2 sk-edu-header edu-header-sk"></div>
                                            <div className="skeleton-line sk-edu-desc edu-header-sk"></div>
                                        </div>
                                        <div className="skeleton-rect rounded-pill sk-edu-search edu-header-sk"></div>
                                    </div>
                                </div>
                                <div className="card-body p-3">
                                    <div className="row g-3">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((_, i) => (
                                            <div className="col-6 col-md-4 col-xl-3" key={i}>
                                                <div className="p-3 rounded-3 text-center border border-light-subtle h-100 bg-white">
                                                    <div className="skeleton-rect mx-auto mb-3 sk-edu-icon"></div>
                                                    <div className="skeleton-line mx-auto mb-2 sk-edu-title"></div>
                                                    <div className="skeleton-line mx-auto sk-edu-sub"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="d-flex flex-column gap-3">
                        {/* Asset Sidebar Skeleton - Matching p-3 gap-0 */}
                        <div className="card shadow-sm border-0 rounded-2 bg-white mb-0">
                            <div className="card-header border-bottom border-light p-3">
                                <div className="skeleton-line sk-sidebar-title"></div>
                            </div>
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <div className="list-group-item border-0 p-3 d-flex align-items-center justify-content-between" key={i}>
                                            <div className="d-flex align-items-center flex-grow-1">
                                                <div className="avatar-xs rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0 skeleton-rect sk-sidebar-icon"></div>
                                                <div className="skeleton-line sk-sidebar-text"></div>
                                            </div>
                                            <div className="skeleton-rect sk-sidebar-action"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Training Academy Skeleton - Matching p-3 gap-3 */}
                        <div className="card shadow-sm border-0 rounded-2 bg-white">
                            <div className="card-header border-bottom border-light p-3 d-flex align-items-center justify-content-between">
                                <div className="skeleton-line sk-sidebar-title"></div>
                                <div className="skeleton-rect sk-training-btn"></div>
                            </div>
                            <div className="card-body p-3 pt-2">
                                <div className="d-flex flex-column gap-3">
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <div className="d-flex align-items-center gap-3" key={i}>
                                            <div className="skeleton-rect rounded-2 flex-shrink-0 sk-vid-thumb"></div>
                                            <div className="flex-grow-1">
                                                <div className="skeleton-line mb-2 sk-vid-title"></div>
                                                <div className="skeleton-line sk-vid-sub"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResourceHubLoader;
