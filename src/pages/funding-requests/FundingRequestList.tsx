import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBorrowerFundingRequests } from '../../modules/funding-requests/queries'
import { DataTable } from '../../components/Table/DataTableWrapper'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import StatisticsCardSkeleton from '../../components/Common/StatisticsCardSkeleton'
import StatisticsCard from '../../components/Common/StatisticsCard'
import { FUNDING_REVIEW_STATUS } from '../../config/funding'

export default function FundingRequestList() {
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    
    const [appliedSearchText, setAppliedSearchText] = useState('')
    const [appliedStatus, setAppliedStatus] = useState<string | null>(null)

    const [sortField, setSortField] = useState<string>('id')
    const [sortOrder, setSortOrder] = useState<number>(-1)

    const { data, isLoading, isFetching } = useBorrowerFundingRequests({
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
            if (r.status === FUNDING_REVIEW_STATUS.APPROVED || r.status === FUNDING_REVIEW_STATUS.ACCEPTED) approved++;
            if (r.status === FUNDING_REVIEW_STATUS.PENDING) pending++;
            if (r.status === FUNDING_REVIEW_STATUS.REJECTED) rejected++;
        });
        return {
            total_reviews: total,
            approved,
            pending,
            rejected
        };
    };

    const handleView = (review: any) => {
        navigate(`/funding-requests/${review.id}`)
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
        if (row.status === FUNDING_REVIEW_STATUS.APPROVED || row.status === FUNDING_REVIEW_STATUS.ACCEPTED) bg = 'success'
        if (row.status === FUNDING_REVIEW_STATUS.REJECTED) bg = 'danger'
        return <span className={`badge bg-${bg}`}>{row.status}</span>
    }

    return (
        <div className="page-content funding-requests-page">
            <div className="container-fluid">
                {/* Header */}
                <div className="row pb-1 page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Requests</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0 fs-12 text-muted">
                                        <li className="breadcrumb-item"><Link to="/" className="text-muted">Dashboard</Link></li>
                                        <li className="breadcrumb-item active text-primary font-weight-bold" aria-current="page">Funding Requests</li>
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
                                                options={Object.values(FUNDING_REVIEW_STATUS).map(status => ({
                                                    label: status,
                                                    value: status
                                                }))}
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
                                        loading={isLoading || isFetching}
                                        dataKey="id"
                                        emptyMessage={<div className="text-center p-3">No funding requests found.</div>}
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
                                            <div className="d-flex gap-2 align-items-center">
                                                <button className="btn btn-sm btn-primary text-nowrap" onClick={() => handleView(row)}>
                                                    <i className="ri-eye-line align-bottom me-1"></i> Details
                                                </button>
                                                {(row.status === FUNDING_REVIEW_STATUS.APPROVED || row.status === FUNDING_REVIEW_STATUS.ACCEPTED) && (
                                                        <Link 
                                                        to="/fund-application" 
                                                        state={{
                                                            purpose: row.use_of_funds === 'Working Capital' ? 'Working Capital (General Use)' : row.use_of_funds,
                                                            requested_amount: row.requested_amount,
                                                            approved_funding: row.funding_sequence?.name || row.funding_type,
                                                            funding_type: row.funding_type
                                                        }}
                                                        className="btn btn-success btn-sm text-nowrap"
                                                        title="Process Funding Application"
                                                    >
                                                        Process Funding Application <i className="ri-arrow-right-line align-bottom ms-1"></i>
                                                    </Link>
                                                )}
                                            </div>
                                        )} style={{ minWidth: '150px' }}></Column>
                                    </DataTable>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

