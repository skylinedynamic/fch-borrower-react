import React from 'react';

/**
 * Skeleton loader for the Agreement Signing Modal (Borrower Frontend)
 */
export const AgreementSignModalLoader = () => {
    return (
        <div className="asm-overlay fade-panel">
            <div className="asm-main-wrapper">
                <div className="asm-modal-card">
                    {/* Side Info Skeleton */}
                    <div className="asm-side-info">
                        <div className="asm-brand-area d-flex align-items-center">
                            <div className="skeleton-line sk-rounded-circle sk-w-32 sk-h-32"></div>
                            <div className="skeleton-line ms-2 sk-w-120 sk-h-16"></div>
                        </div>
                        <div className="asm-step-box mt-5">
                            <div className="skeleton-line mb-2 sk-w-100 sk-h-12"></div>
                            <div className="skeleton-line mb-3 w-100 sk-h-24"></div>
                            <div className="skeleton-line sk-w-90 sk-h-40"></div>
                        </div>
                        <div className="mt-5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="d-flex gap-3 mb-4">
                                    <div className="skeleton-line rounded sk-w-28 sk-h-28"></div>
                                    <div className="flex-grow-1">
                                        <div className="skeleton-line mb-1 sk-w-80 sk-h-12"></div>
                                        <div className="skeleton-line w-100 sk-h-10"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Area Skeleton */}
                    <div className="asm-content-area d-flex flex-column flex-grow-1">
                        <div className="asm-content-header border-bottom p-4">
                            <div className="skeleton-line mb-1 sk-w-180 sk-h-20"></div>
                            <div className="skeleton-line sk-w-120 sk-h-10"></div>
                        </div>
                        <div className="asm-document-frame p-4 flex-grow-1 bg-light">
                            <div className="bg-white shadow-sm p-5 h-100 rounded">
                                <div className="skeleton-line mb-5 mx-auto sk-w-140 sk-h-40"></div>
                                <div className="skeleton-line mb-4 sk-w-60p sk-h-24"></div>
                                <div className="skeleton-line mb-3 w-100 sk-h-12"></div>
                                <div className="skeleton-line mb-3 w-100 sk-h-12"></div>
                                <div className="skeleton-line mb-3 w-100 sk-h-12"></div>
                                <div className="skeleton-line mb-5 sk-w-80p sk-h-12"></div>
                                <div className="skeleton-line mb-4 sk-w-40p sk-h-20"></div>
                                <div className="skeleton-line mb-3 w-100 sk-h-12"></div>
                                <div className="skeleton-line mb-3 w-100 sk-h-12"></div>
                                <div className="skeleton-line w-100 sk-h-12"></div>
                            </div>
                        </div>
                        <div className="asm-action-footer p-4 border-top">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="skeleton-line rounded sk-w-20 sk-h-20"></div>
                                    <div className="skeleton-line sk-w-240 sk-h-14"></div>
                                </div>
                                <div className="skeleton-line rounded sk-w-160 sk-h-42"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
