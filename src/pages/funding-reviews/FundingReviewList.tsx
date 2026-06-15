import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBorrowerFundingReviews } from '../../modules/funding-reviews/queries'
import { DataTable } from '../../components/Table/DataTableWrapper'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import FundingReviewModal from './FundingReviewModal'
import StatisticsCardSkeleton from '../../components/Common/StatisticsCardSkeleton'

export default function FundingReviewList() {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    
    const [appliedSearchText, setAppliedSearchText] = useState('')
    const [appliedStatus, setAppliedStatus] = useState<string | null>(null)
    
    const [selectedReview, setSelectedReview] = useState<any>(null)
    const [showModal, setShowModal] = useState(false)

    const { data, isLoading } = useBorrowerFundingReviews({
        page,
        per_page: perPage,
        search: appliedSearchText,
        status: appliedStatus || undefined
    })

    // Fix the nested data access
    const reviews = data?.data || []
    const total = data?.meta?.total || 0

    // Compute dummy stats from current page since there's no stats API
    const computeStats = () => {
        if (!data?.data) return null;
        let approved = 0, pending = 0, rejected = 0;
        data.data.forEach((r: any) => {
            if (r.status === 'Approved') approved++;
            if (r.status === 'Pending') pending++;
            if (r.status === 'Rejected') rejected++;
        });
        return {
            total_reviews: total,
            approved,
            pending,
            rejected
        };
    };

    const handleView = (review: any) => {
        setSelectedReview(review)
        setShowModal(true)
    }

    const onPage = (e: any) => {
        // DataTable uses 0-based first index, so page = Math.floor(e.first / e.rows) + 1
        setPage(Math.floor(e.first / e.rows) + 1)
        setPerPage(e.rows)
    }

    const handleApplyFilters = () => {
        setAppliedSearchText(searchText)
        setAppliedStatus(selectedStatus)
        setPage(1)
    }

    const handleClearFilters = () => {
        setSearchText('')
        setSelectedStatus(null)
        setAppliedSearchText('')
        setAppliedStatus(null)
        setPage(1)
    }

    const statusBodyTemplate = (row: any) => {
        let bg = 'warning'
        if (row.status === 'Approved') bg = 'success'
        if (row.status === 'Rejected') bg = 'danger'
        return <span className={`badge bg-${bg}`}>{row.status}</span>
    }

    const actionBodyTemplate = (row: any) => {
        return (
            <div className="d-flex gap-2">
                <button className="btn btn-sm btn-primary" onClick={() => handleView(row)}>
                    View Details
                </button>
                {row.status === 'Rejected' && (
                    <Link 
                        to={`/funding/${row.funding_sequence?.id}/review?amount=${row.requested_amount || ''}&purpose=${encodeURIComponent(row.use_of_funds || 'Working Capital')}`} 
                        className="btn btn-sm btn-outline-danger"
                    >
                        Update Application
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="page-content funding-reviews-page">
            <div className="container-fluid">
                {/* Header */}
                <div className="row pb-1 page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Reviews</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0 fs-12 text-muted">
                                        <li className="breadcrumb-item"><Link to="/" className="text-muted">Dashboard</Link></li>
                                        <li className="breadcrumb-item active text-primary font-weight-bold" aria-current="page">Funding Reviews</li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="mt-0">
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards rendered inline to avoid component import issues */}
                {isLoading ? (
                    <div className="row">
                        <StatisticsCardSkeleton />
                        <StatisticsCardSkeleton />
                        <StatisticsCardSkeleton />
                        <StatisticsCardSkeleton />
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate mb-0">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-2 fs-2">
                                                <i className="ri-file-list-3-line text-primary"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden ms-3">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-1">Total Reviews</p>
                                            <h4 className="fs-4 flex-grow-1 mb-0">{computeStats()?.total_reviews || 0}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate mb-0">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle text-success rounded-2 fs-2">
                                                <i className="ri-checkbox-circle-line text-success"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden ms-3">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-1">Total Approved</p>
                                            <h4 className="fs-4 flex-grow-1 mb-0">{computeStats()?.approved || 0}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate mb-0">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle text-info rounded-2 fs-2">
                                                <i className="ri-time-line text-info"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden ms-3">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-1">Total Pending</p>
                                            <h4 className="fs-4 flex-grow-1 mb-0">{computeStats()?.pending || 0}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate mb-0">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-2 fs-2">
                                                <i className="ri-close-circle-line text-danger"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden ms-3">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-1">Total Rejected</p>
                                            <h4 className="fs-4 flex-grow-1 mb-0">{computeStats()?.rejected || 0}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body list-fluid-card">
                                {/* Filters */}
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleApplyFilters();
                                }}>
                                    <div className="row g-3 mb-4">
                                        <div className="col-xxl-6 col-sm-6">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control search bg-light border-light"
                                                    placeholder="Search reviews..."
                                                    autoComplete="off"
                                                    value={searchText}
                                                    onChange={(e) => setSearchText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleApplyFilters();
                                                        }
                                                    }}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-xxl-4 col-sm-6">
                                            <Dropdown
                                                value={selectedStatus}
                                                options={[
                                                    { label: 'Pending', value: 'Pending' },
                                                    { label: 'Approved', value: 'Approved' },
                                                    { label: 'Rejected', value: 'Rejected' }
                                                ]}
                                                onChange={(e) => setSelectedStatus(e.value)}
                                                placeholder="All Statuses"
                                                className="w-100 bg-light border-light"
                                                style={{ height: '38px' }}
                                                inputStyle={{ height: '38px' }}
                                            />
                                        </div>
                                        <div className="col-xxl-2 col-sm-6 d-flex gap-2 justify-content-end">
                                            <button 
                                                type="button" 
                                                className="btn btn-warning flex-grow-1"
                                                onClick={handleApplyFilters}
                                            >
                                                <i className="ri-equalizer-fill me-1 align-bottom"></i> Filters
                                            </button>
                                             <button type="button" className="btn-clear flex-grow-1" onClick={handleClearFilters}>
                                                <i className="ri-close-line me-1 align-bottom"></i> Clear
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="table-responsive table-card">
                                    <DataTable
                                        value={reviews}
                                        paginator
                                        lazy
                                        first={(page - 1) * perPage}
                                        rows={perPage}
                                        totalRecords={total}
                                        onPage={onPage}
                                        loading={isLoading}
                                        dataKey="id"
                                        emptyMessage={<div className="text-center p-3">No funding reviews found.</div>}
                                    >
                                        <Column field="id" header="ID" style={{ width: '80px' }}></Column>
                                        <Column field="funding_type" header="Funding Type" body={(row) => row.funding_type || 'N/A'}></Column>
                                        <Column header="Requested Amount" body={(row) => row.requested_amount ? `$${Number(row.requested_amount).toLocaleString()}` : 'N/A'}></Column>
                                        <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                        <Column header="Created At" body={(row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}></Column>
                                        <Column header="Actions" body={actionBodyTemplate} style={{ width: '120px' }}></Column>
                                    </DataTable>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedReview && (
                <FundingReviewModal 
                    show={showModal} 
                    onHide={() => setShowModal(false)} 
                    review={selectedReview} 
                />
            )}
        </div>
    )
}

