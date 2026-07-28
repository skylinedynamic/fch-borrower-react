import React from 'react'
import '../../../components/Common/StatisticsCardSkeleton.css'

const Skeleton = ({ w, h, rounded = false }: { w: number | string; h: number; rounded?: boolean }) => (
    <div className={`skeleton-shimmer ${rounded ? 'rounded-circle' : 'rounded'}`} style={{ width: w, height: h }}></div>
)

export default function FundingApplicationDetailLoader() {
    return (
        <div className="page-content">
            <div className="container-fluid">
                <div className="row pb-1 page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <Skeleton w={200} h={24} />
                                <div className="mt-2"><Skeleton w={150} h={14} /></div>
                            </div>
                            <div className="mt-0">
                                <Skeleton w={80} h={36} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row g-4 mt-2">
                    <div className="col-lg-8">
                        {/* 1. Business Information Skeleton */}
                        <div className="card border shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Skeleton w={24} h={24} rounded />
                                    <Skeleton w={180} h={18} />
                                </div>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-3">
                                    <div className="col-12 mb-2">
                                        <div className="mb-2"><Skeleton w={60} h={12} /></div>
                                        <Skeleton w="40%" h={24} />
                                    </div>
                                    <div className="col-12 mb-2">
                                        <div className="mb-2"><Skeleton w={100} h={12} /></div>
                                        <Skeleton w="80%" h={16} />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <div className="mb-2"><Skeleton w={80} h={12} /></div>
                                        <Skeleton w="60%" h={16} />
                                    </div>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={`biz-mid-${i}`} className="col-sm-6 mb-3">
                                            <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                            <div><Skeleton w={180} h={16} /></div>
                                        </div>
                                    ))}
                                    <div className="col-12"><hr className="border-light my-1" /></div>
                                    <div className="col-12 mb-3 mt-3">
                                        <div className="mb-2"><Skeleton w={60} h={12} /></div>
                                        <Skeleton w="90%" h={16} />
                                    </div>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={`biz-bot-${i}`} className="col-sm-6 mb-3">
                                            <div className="mb-2"><Skeleton w={80} h={12} /></div>
                                            <div><Skeleton w={140} h={16} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Financial Information Skeleton */}
                        <div className="card border shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Skeleton w={24} h={24} rounded />
                                    <Skeleton w={160} h={18} />
                                </div>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="col-sm-6 mb-3">
                                            <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                            <div><Skeleton w={160} h={16} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Funding Request Skeleton */}
                        <div className="card border shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Skeleton w={24} h={24} rounded />
                                    <Skeleton w={140} h={18} />
                                </div>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-3">
                                    <div className="col-12 mb-3">
                                        <div className="mb-2"><Skeleton w={100} h={12} /></div>
                                        <Skeleton w="100%" h={16} />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                        <Skeleton w="100%" h={16} />
                                    </div>
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={`req-mid-${i}`} className="col-sm-6 mb-3">
                                            <div className="mb-2"><Skeleton w={110} h={12} /></div>
                                            <div><Skeleton w={140} h={16} /></div>
                                        </div>
                                    ))}
                                    <div className="col-12 mb-3 mt-2">
                                        <div className="mb-2"><Skeleton w={80} h={12} /></div>
                                        <Skeleton w="100%" h={16} />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                        <Skeleton w="100%" h={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Compliance Disclosures Skeleton */}
                        <div className="card border shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom py-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Skeleton w={24} h={24} rounded />
                                    <Skeleton w={200} h={18} />
                                </div>
                            </div>
                            <div className="card-body pt-4">
                                <div className="row g-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="col-sm-6 mb-3">
                                            <div className="mb-2"><Skeleton w={130} h={12} /></div>
                                            <div><Skeleton w={80} h={16} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. Documents Skeleton */}
                        <div className="card border shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom py-3 px-4">
                                <div className="d-flex align-items-center gap-2">
                                    <Skeleton w={24} h={24} rounded />
                                    <Skeleton w={180} h={18} />
                                </div>
                            </div>
                            <div className="card-body px-4 pb-4 pt-3">
                                <div className="table-responsive">
                                    <table className="table table-nowrap align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th><Skeleton w={100} h={14} /></th>
                                                <th><Skeleton w={60} h={14} /></th>
                                                <th><Skeleton w={80} h={14} /></th>
                                                <th><Skeleton w={40} h={14} /></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3].map(i => (
                                                <tr key={i}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Skeleton w={24} h={24} rounded />
                                                            <Skeleton w={140} h={14} />
                                                        </div>
                                                    </td>
                                                    <td><Skeleton w={60} h={20} /></td>
                                                    <td><Skeleton w={100} h={14} /></td>
                                                    <td><Skeleton w={30} h={30} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header px-3 py-2 align-items-center justify-content-between d-flex flex-column flex-sm-row gap-2 bg-white border-bottom">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="ri-history-line fs-18 text-dark"></i>
                                    <h5 className="mb-0 fw-bold text-dark fs-16">Activity</h5>
                                </div>
                            </div>
                            <div className="card-body px-3 pt-3 pb-3" style={{ maxHeight: '600px', overflow: 'hidden' }}>
                                <div className="timeline-container position-relative px-0">
                                    <div className="pt-2 pb-3">
                                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                            <div key={i} className="d-flex timeline-item-row position-relative mb-3 p-1">
                                                <div className="timeline-dot-container me-3 position-relative" style={{ zIndex: 2, marginTop: '2px' }}>
                                                    <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center border border-white" style={{ width: 36, height: 36 }}>
                                                        <Skeleton w={36} h={36} rounded />
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 border-0 mb-0 mt-1" style={{ minWidth: 0 }}>
                                                    <div className="mb-2"><Skeleton w="80%" h={14} /></div>
                                                    <div><Skeleton w="50%" h={12} /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
