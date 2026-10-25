import React from 'react';

// Mirrors the Funding Options page (styles in pages/funding/Funding.css): the
// banner with the four overview cards, how funding works, the toolbar and the
// program cards, so nothing shifts when the data arrives.

const Line = ({ w, h, r = 4, className = '' }: { w: number | string; h: number; r?: number; className?: string }) => (
    <div className={`skeleton-line ${className}`} style={{ width: w, height: h, borderRadius: r }} />
);

const SkeletonStat = () => (
    <div className="fp-stat">
        <div className="fp-stat-head">
            <Line w="55%" h={11} />
            <Line w={44} h={44} className="flex-shrink-0" />
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 14 }}>
            <Line w="45%" h={24} />
        </div>
        <div className="fp-stat-foot">
            <Line w="100%" h={6} r={6} />
            <Line w="35%" h={11} />
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="fc-card-wrap">
        <div className="funding-card">
            <div className="funding-card-top">
                <Line w={40} h={40} className="flex-shrink-0" />
                <Line w="65%" h={14} />
                <div style={{ gridColumn: '1 / -1' }}>
                    <Line w="80%" h={11} />
                </div>
            </div>
            <div className="funding-card-bottom">
                <div className="funding-card-meta">
                    <Line w={130} h={17} />
                    <Line w={92} h={22} />
                </div>
                <Line w={34} h={34} r={17} />
            </div>
        </div>
    </div>
);

const SkeletonGroup = ({ cards = 4, titleWidth = 200 }: { cards?: number; titleWidth?: number }) => (
    <section className="fp-group">
        <div className="fp-group-head">
            <Line w={titleWidth} h={18} />
            <Line w={26} h={22} />
            <span className="fp-group-rule" aria-hidden="true"></span>
        </div>
        <div className="fp-grid">
            {Array.from({ length: cards }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    </section>
);

const FundingLoader = () => (
    <div className="page-content funding-page">
        <div className="container-fluid">
            <div className="fp-shell" aria-hidden="true">
                {/* ── Banner and overview cards ───────────────────────────── */}
                <div className="fp-hero fp-hero-skeleton">
                    <Line w={170} h={12} className="mb-4" />
                    <Line w={230} h={26} className="mb-3" />
                    <Line w="min(420px, 80%)" h={13} />
                </div>
                <div className="fp-stats">
                    {[1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)}
                </div>

                {/* ── How funding works ───────────────────────────────────── */}
                <div className="funding-how card border">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <Line w={150} h={16} />
                            <Line w={150} h={30} />
                        </div>
                        <div className="d-flex gap-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} style={{ flex: 1 }}>
                                    <Line w="100%" h={74} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Toolbar ─────────────────────────────────────────────── */}
                <div className="fp-toolbar">
                    <div className="fp-search"><Line w="100%" h={37.5} /></div>
                    <div className="fp-category"><Line w="100%" h={37.5} /></div>
                    <div className="fp-actions"><Line w={100} h={37.5} /></div>
                </div>

                <SkeletonGroup titleWidth={150} />
                <SkeletonGroup titleWidth={130} />
            </div>
        </div>
    </div>
);

export default FundingLoader;
