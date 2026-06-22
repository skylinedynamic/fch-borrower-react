import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBorrowerFundingReviews } from '../../modules/funding-reviews/queries'
import { DataTable } from '../../components/Table/DataTableWrapper'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import FundingReviewModal from './FundingReviewModal'
import StatisticsCardSkeleton from '../../components/Common/StatisticsCardSkeleton'
import StatisticsCard from '../../components/Common/StatisticsCard'

export default function FundingReviewList() {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    
    const [appliedSearchText, setAppliedSearchText] = useState('')
    const [appliedStatus, setAppliedStatus] = useState<string | null>(null)
    
    const [selectedReview, setSelectedReview] = useState<any>(null)
    const [showModal, setShowModal] = useState(false)

    const [sortField, setSortField] = useState<string>('id')
    const [sortOrder, setSortOrder] = useState<number>(-1)

    const { data, isLoading } = useBorrowerFundingReviews({
        page,
        per_page: perPage,
        search: appliedSearchText,
        status: appliedStatus || undefined,
        sort_field: sortField,
        sort_order: sortOrder === 1 ? 'asc' : 'desc'
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
        setPage(Math.floor(e.first / e.rows) + 1)
        setPerPage(e.rows)
    }

    const onSort = (e: any) => {
        setSortField(e.sortField)
        setSortOrder(e.sortOrder)
        setPage(1)
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
                        <StatisticsCard
                            title="Total Reviews"
                            count={computeStats()?.total_reviews || 0}
                            icon="ri-file-list-3-line"
                            colorVariant="primary"
                        />
                        <StatisticsCard
                            title="Total Approved"
                            count={computeStats()?.approved || 0}
                            icon="ri-checkbox-circle-line"
                            colorVariant="success"
                        />
                        <StatisticsCard
                            title="Total Pending"
                            count={computeStats()?.pending || 0}
                            icon="ri-time-line"
                            colorVariant="info"
                        />
                        <StatisticsCard
                            title="Total Rejected"
                            count={computeStats()?.rejected || 0}
                            icon="ri-close-circle-line"
                            colorVariant="danger"
                        />
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
                                        onSort={onSort}
                                        sortField={sortField}
                                        sortOrder={sortOrder as any}
                                        loading={isLoading}
                                        dataKey="id"
                                        emptyMessage={<div className="text-center p-3">No funding reviews found.</div>}
                                    >
                                        <Column field="funding_type" header="Funding Type" sortable body={(row) => row.funding_type || 'N/A'}></Column>
                                        <Column field="use_of_funds" header="Uses" sortable body={(row) => row.use_of_funds || 'N/A'}></Column>
                                        <Column field="requested_amount" header="Requested Amount" sortable body={(row) => row.requested_amount ? `$${Number(row.requested_amount).toLocaleString()}` : 'N/A'}></Column>
                                        <Column field="amount_range" header="Estimated Amount" sortable body={(row) => {
                                            if (!row.funding_sequence?.amount_range) return 'N/A';
                                            return row.funding_sequence.amount_range.split('-').map((num: string) => {
                                                const cleanStr = num.replace(/[$,]/g, '').trim();
                                                const parsed = Number(cleanStr);
                                                return isNaN(parsed) ? num.trim() : '$' + parsed.toLocaleString();
                                            }).join(' - ');
                                        }}></Column>
                                        <Column field="status" header="Status" sortable body={statusBodyTemplate}></Column>
                                        <Column field="created_at" header="Created At" sortable body={(row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}></Column>
                                        <Column header="Actions" body={(row: any) => (
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-primary" onClick={() => handleView(row)}>
                                                    <i className="ri-eye-line align-bottom me-1"></i> Details
                                                </button>
                                            </div>
                                        )} style={{ width: '120px' }}></Column>
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

