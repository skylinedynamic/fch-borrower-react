import React from 'react';

export default function DashboardLoader() {
    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* Header Section Skeleton */}
                <div className="row mb-3 pb-1">
                    <div className="col-12">
                        <div className="d-flex align-items-lg-center flex-lg-row flex-column justify-content-between">
                            <div className="flex-grow-1">
                                <div className="skeleton-line mb-2" style={{ width: '200px', height: '24px' }}></div>
                                <div className="skeleton-line" style={{ width: '300px', height: '16px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards Skeleton */}
                <div className="row">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div className="col-xl-3 col-md-6" key={index}>
                            <div className="card dashboard-card card-animate border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between">
                                        <div className="flex-grow-1">
                                            <div className="skeleton-line mb-2" style={{ width: '60%', height: '12px' }}></div>
                                            <div className="skeleton-line" style={{ width: '40%', height: '28px' }}></div>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="skeleton-rect" style={{ width: '48px', height: '48px', borderRadius: '8px' }}></span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-1 d-flex justify-content-between align-items-center">
                                        <div className="skeleton-line" style={{ width: '80px', height: '12px' }}></div>
                                        <div className="skeleton-line" style={{ width: '60px', height: '12px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row mt-3">
                    {/* Left Column (Main Content) */}
                    <div className="col-xl-9">
                        {/* Credit Score & Tier Skeleton */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card dashboard-card border-0 shadow-sm h-100">
                                    <div className="card-header bg-transparent border-0 pb-0">
                                        <div className="skeleton-line" style={{ width: '120px', height: '18px' }}></div>
                                    </div>
                                    <div className="card-body d-flex align-items-center justify-content-between p-4">
                                        <div className="skeleton-circle" style={{ width: '120px', height: '120px' }}></div>
                                        <div className="flex-grow-1 ms-4">
                                            <div className="skeleton-line mb-2" style={{ width: '80%', height: '14px' }}></div>
                                            <div className="d-flex gap-2">
                                                <div className="skeleton-rect" style={{ width: '100px', height: '32px', borderRadius: '20px' }}></div>
                                                <div className="skeleton-rect" style={{ width: '100px', height: '32px', borderRadius: '20px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card dashboard-card border-0 shadow-sm h-100">
                                    <div className="card-header bg-transparent border-0 pb-0">
                                        <div className="skeleton-line" style={{ width: '150px', height: '18px' }}></div>
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column justify-content-center">
                                        <div className="d-flex justify-content-between align-items-end mb-2">
                                            <div className="skeleton-line" style={{ width: '100px', height: '24px' }}></div>
                                            <div className="skeleton-line" style={{ width: '60px', height: '16px' }}></div>
                                        </div>
                                        <div className="skeleton-rect mb-3" style={{ width: '100%', height: '8px', borderRadius: '20px' }}></div>
                                        <div className="skeleton-line" style={{ width: '70%', height: '14px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pre-Qualification Table Skeleton */}
                        <div className="card dashboard-card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between py-3 px-4">
                                <div className="skeleton-line" style={{ width: '250px', height: '18px' }}></div>
                                <div className="skeleton-line" style={{ width: '100px', height: '14px' }}></div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <th key={i} className="py-3">
                                                        <div className="skeleton-line" style={{ width: '80%', height: '12px' }}></div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 4 }).map((_, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="skeleton-circle" style={{ width: '36px', height: '36px' }}></div>
                                                            <div>
                                                                <div className="skeleton-line mb-1" style={{ width: '120px', height: '14px' }}></div>
                                                                <div className="skeleton-line" style={{ width: '80px', height: '12px' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-line" style={{ width: '90px', height: '12px' }}></div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-rect" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-line" style={{ width: '100px', height: '12px' }}></div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-rect" style={{ width: '70px', height: '24px', borderRadius: '20px' }}></div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <div className="skeleton-circle mx-auto" style={{ width: '32px', height: '32px' }}></div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Funding Applications Table Skeleton */}
                        <div className="card dashboard-card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between py-3 px-4">
                                <div className="skeleton-line" style={{ width: '250px', height: '18px' }}></div>
                                <div className="skeleton-line" style={{ width: '100px', height: '14px' }}></div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <th key={i} className="py-3">
                                                        <div className="skeleton-line" style={{ width: '80%', height: '12px' }}></div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 4 }).map((_, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="skeleton-circle" style={{ width: '36px', height: '36px' }}></div>
                                                            <div>
                                                                <div className="skeleton-line mb-1" style={{ width: '140px', height: '14px' }}></div>
                                                                <div className="skeleton-line" style={{ width: '80px', height: '12px' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-line" style={{ width: '80px', height: '14px' }}></div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-line" style={{ width: '100px', height: '12px' }}></div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="skeleton-rect" style={{ width: '80px', height: '24px', borderRadius: '20px' }}></div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <div className="skeleton-circle mx-auto" style={{ width: '32px', height: '32px' }}></div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="col-xl-3">
                        {/* Upcoming Meetings Skeleton */}
                        <div className="card dashboard-card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 py-3">
                                <div className="skeleton-line" style={{ width: '160px', height: '18px' }}></div>
                            </div>
                            <div className="card-body pt-0">
                                <div className="vstack gap-3">
                                    {Array.from({ length: 3 }).map((_, idx) => (
                                        <div className="d-flex align-items-center p-3 rounded-3 bg-light-subtle border border-light" key={idx}>
                                            <div className="flex-shrink-0 text-center me-3">
                                                <div className="skeleton-rect" style={{ width: '48px', height: '48px', borderRadius: '8px' }}></div>
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="skeleton-line mb-1" style={{ width: '80%', height: '14px' }}></div>
                                                <div className="skeleton-line" style={{ width: '60%', height: '12px' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="skeleton-rect mt-3" style={{ width: '100%', height: '36px', borderRadius: '20px' }}></div>
                            </div>
                        </div>

                        {/* Quick Support Skeleton */}
                        <div className="card dashboard-card bg-primary-subtle border-0 shadow-sm">
                            <div className="card-body p-4 text-center">
                                <div className="skeleton-circle mx-auto mb-3" style={{ width: '48px', height: '48px' }}></div>
                                <div className="skeleton-line mx-auto mb-2" style={{ width: '120px', height: '18px' }}></div>
                                <div className="skeleton-line mx-auto mb-3" style={{ width: '80%', height: '14px' }}></div>
                                <div className="skeleton-rect mx-auto" style={{ width: '150px', height: '36px', borderRadius: '20px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
