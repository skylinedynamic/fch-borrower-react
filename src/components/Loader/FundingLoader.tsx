import React from 'react';

// ─── Reusable skeleton card — IDENTICAL layout every time ────────────────────
// All width/height values are fixed so every card skeleton is the same height.
const SkeletonCard = () => (
    <div
        style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 14,
            background: '#fff',
            border: '1px solid #e8ecf0',
            borderRadius: 4,
            padding: '16px 18px',
            width: '100%',
            minHeight: 110,
        }}
    >
        {/* Icon placeholder */}
        <div
            className="skeleton-line flex-shrink-0"
            style={{ width: 44, height: 44, borderRadius: 12, alignSelf: 'center' }}
        />

        {/* Text content — FIXED heights so all cards are identical */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Title line */}
            <div className="skeleton-line" style={{ width: '72%', height: 14, borderRadius: 4 }} />

            {/* Subtitle — 2 lines, same fixed widths always */}
            <div style={{ margin: '8px 0' }}>
                <div className="skeleton-line mb-1" style={{ width: '90%', height: 11, borderRadius: 4 }} />
                <div className="skeleton-line" style={{ width: '75%', height: 11, borderRadius: 4 }} />
            </div>

            {/* Tags row */}
            <div className="d-flex gap-2">
                <div className="skeleton-line" style={{ width: 80, height: 20, borderRadius: 20 }} />
                <div className="skeleton-line" style={{ width: 60, height: 20, borderRadius: 20 }} />
            </div>
        </div>

        {/* Arrow placeholder */}
        <div
            className="skeleton-line flex-shrink-0"
            style={{ width: 30, height: 30, borderRadius: '50%', alignSelf: 'center' }}
        />
    </div>
);

// ─── Reusable group skeleton ──────────────────────────────────────────────────
const SkeletonGroup = ({ cards = 4, titleWidth = 200 }: { cards?: number; titleWidth?: number }) => (
    <div className="mb-4">
        {/* Group header */}
        <div className="d-flex align-items-center gap-2 mb-3">
            <div className="skeleton-line" style={{ width: titleWidth, height: 18, borderRadius: 4 }} />
            <div className="skeleton-line" style={{ width: 26, height: 20, borderRadius: 20 }} />
        </div>

        {/* Cards grid */}
        <div className="row g-3">
            {Array.from({ length: cards }).map((_, i) => (
                <div
                    className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 d-flex align-items-stretch"
                    key={i}
                >
                    <SkeletonCard />
                </div>
            ))}
        </div>
    </div>
);

// ─── Main Loader ──────────────────────────────────────────────────────────────
const FundingLoader = () => {
    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* ── Subheader / Title Skeleton ─────────────────────────── */}
                <div className="row page-subheader-sticky bg-body" style={{ marginBottom: 0 }}>
                    <div className="col-12">
                        <div className="d-flex align-items-center py-2">
                            <div>
                                <div className="skeleton-line mb-2" style={{ width: 180, height: 22, borderRadius: 4 }} />
                                <div className="d-flex align-items-center gap-2">
                                    <div className="skeleton-line" style={{ width: 72, height: 13, borderRadius: 4 }} />
                                    <div className="skeleton-line" style={{ width: 8, height: 13, borderRadius: 4 }} />
                                    <div className="skeleton-line" style={{ width: 110, height: 13, borderRadius: 4 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards Skeleton ────────────────────────────────── */}
                <div className="row g-4">
                    {[1, 2, 3, 4].map(i => (
                        <div className="col-xl-3 col-md-6" key={i}>
                            <div className="card shadow-sm border-0 rounded-2 bg-white">
                                <div className="card-body py-3 px-4 d-flex align-items-center">
                                    <div
                                        className="skeleton-line me-3 flex-shrink-0"
                                        style={{ width: 52, height: 52, borderRadius: 8 }}
                                    />
                                    <div className="flex-grow-1">
                                        <div className="skeleton-line mb-2" style={{ width: '55%', height: 11, borderRadius: 4 }} />
                                        <div className="skeleton-line" style={{ width: '40%', height: 22, borderRadius: 4 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filter Bar Skeleton ────────────────────────────────── */}
                <div className="row mb-2">
                  <div className="col-12">
                    <div className="card shadow-sm border-0 bg-white mb-2">
                      <div className="card-body p-3">
                        <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-3">
                            <div className="skeleton-line" style={{ flex: '1 1 200px', height: 40, borderRadius: 6 }} />
                            <div className="skeleton-line flex-shrink-0" style={{ width: 220, height: 40, borderRadius: 6 }} />
                            <div className="skeleton-line flex-shrink-0" style={{ width: 100, height: 40, borderRadius: 6 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Group Skeletons — all use the same SkeletonCard ───── */}
                <SkeletonGroup cards={4} titleWidth={220} />
                <SkeletonGroup cards={4} titleWidth={180} />
                <SkeletonGroup cards={4} titleWidth={200} />

            </div>
        </div>
    );
};

export default FundingLoader;
