import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBorrowerFundingRequests } from '../../modules/funding-requests/queries'
// Imports the real PrimeReact type declarations for prop-checking; Vite's alias
// (see vite.config.js) still substitutes this with DataTableWrapper.jsx at runtime/build.
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import StatisticsCardSkeleton from '../../components/Common/StatisticsCardSkeleton'
import StatisticsCard from '../../components/Common/StatisticsCard'
import { FUNDING_REVIEW_STATUS, FUNDING_APPLICATION_STATUS_OPTIONS } from '../../config/funding'
import '../../../assets/css/funding-requests.css'

export default function FundingRequestList() {
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [searchText, setSearchText] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    const [selectedAppStatus, setSelectedAppStatus] = useState<string | null>(null)
    const [selectedFundingType, setSelectedFundingType] = useState<string | null>(null)

    const [appliedSearchText, setAppliedSearchText] = useState('')
    const [appliedStatus, setAppliedStatus] = useState<string | null>(null)
    const [appliedAppStatus, setAppliedAppStatus] = useState<string | null>(null)
    const [appliedFundingType, setAppliedFundingType] = useState<string | null>(null)

    const [sortField, setSortField] = useState<string>('id')
    const [sortOrder, setSortOrder] = useState<number>(-1)

    const { data, isLoading, isFetching } = useBorrowerFundingRequests({
        page,
        per_page: perPage,
        search: appliedSearchText,
        status: appliedStatus || undefined,
        application_status: appliedAppStatus || undefined,
        funding_sequence_id: appliedFundingType || undefined,
        sort_field: sortField,
        sort_order: sortOrder === 1 ? 'asc' : 'desc'
    })

    // Fix the nested data access
    const reviews = data?.data || []
    const total = data?.meta?.total || 0
    const fundingTypes = data?.funding_types || []

    // Use global stats from API, fallback to current page computation
    const computeStats = () => {
        if (data?.stats) return data.stats;
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

    const stats = data?.stats || computeStats();

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
        setAppliedAppStatus(selectedAppStatus)
        setAppliedFundingType(selectedFundingType)
        setPage(1)
    }

    const handleClearFilters = () => {
        setSearchText('')
        setSelectedStatus(null)
        setSelectedAppStatus(null)
        setSelectedFundingType(null)
        setAppliedSearchText('')
        setAppliedStatus(null)
        setAppliedAppStatus(null)
        setAppliedFundingType(null)
        setPage(1)
    }

    const statusBodyTemplate = (row: any) => {
        let bg = 'warning'
        if (row.status === FUNDING_REVIEW_STATUS.APPROVED) bg = 'success'
        if (row.status === FUNDING_REVIEW_STATUS.ACCEPTED) bg = 'info'
        if (row.status === FUNDING_REVIEW_STATUS.REJECTED) bg = 'danger'
        if (row.status === FUNDING_REVIEW_STATUS.CANCELED) bg = 'secondary'
        if (row.status === FUNDING_REVIEW_STATUS.IN_PROGRESS) bg = 'primary'
        return <span className={`badge bg-${bg}`}>{row.status}</span>
    }

    const applicationStatusTemplate = (row: any) => {
        if (!row.application_status) {
            // Only show 'Not Started' when the request is Approved
            if (row.status === FUNDING_REVIEW_STATUS.APPROVED) {
                return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Not Started</span>
            }
            return <span className="text-muted fs-12">—</span>
        }
        // Map application status to badge colour
        const appStatus: string = row.application_status
        const lower = appStatus.toLowerCase()
        let appBg = 'bg-secondary'
        if (lower.includes('hold') || lower.includes('draft')) appBg = 'bg-warning text-dark'
        else if (lower.includes('submitted')) appBg = 'bg-info'
        else if (lower.includes('approved') || lower.includes('funded')) appBg = 'bg-success'
        else if (lower.includes('missing') || lower.includes('rejected')) appBg = 'bg-danger'
        else if (lower.includes('review') || lower.includes('progress')) appBg = 'bg-primary'
        return <span className={`badge ${appBg}`} title={appStatus}>{appStatus}</span>
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
                            count={stats?.total_reviews || 0}
                            icon="ri-file-list-3-line"
                            colorVariant="primary"
                        />
                        <StatisticsCard
                            title="Total Approved"
                            count={stats?.approved || 0}
                            icon="ri-checkbox-circle-line"
                            colorVariant="success"
                        />
                        <StatisticsCard
                            title="Total Pending"
                            count={stats?.pending || 0}
                            icon="ri-time-line"
                            colorVariant="info"
                        />
                        <StatisticsCard
                            title="Total Rejected"
                            count={stats?.rejected || 0}
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
                                        <div className="col-xl-3 col-md-6">
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
                                        <div className="col-xl-2 col-md-6">
                                            <Dropdown
                                                value={selectedStatus}
                                                options={Object.values(FUNDING_REVIEW_STATUS).map(status => ({
                                                    label: status,
                                                    value: status
                                                }))}
                                                onChange={(e) => setSelectedStatus(e.value)}
                                                placeholder="Request Status"
                                                className="w-100 bg-light border-light fr-filter-dropdown"
                                            />
                                        </div>
                                        <div className="col-xl-2 col-md-6">
                                            <Dropdown
                                                value={selectedAppStatus}
                                                options={[
                                                    { label: 'Not Started', value: 'Not Started' },
                                                    ...FUNDING_APPLICATION_STATUS_OPTIONS
                                                ]}
                                                onChange={(e) => setSelectedAppStatus(e.value)}
                                                placeholder="Application Status"
                                                className="w-100 bg-light border-light fr-filter-dropdown"
                                            />
                                        </div>
                                        <div className="col-xl-2 col-md-6">
                                            <Dropdown
                                                value={selectedFundingType}
                                                options={fundingTypes.map((ft: any) => ({
                                                    label: ft.name,
                                                    value: ft.id
                                                }))}
                                                onChange={(e) => setSelectedFundingType(e.value)}
                                                placeholder="Funding Type"
                                                className="w-100 bg-light border-light fr-filter-dropdown"
                                            />
                                        </div>
                                        <div className="col-xl-3 col-md-12 d-flex gap-2 justify-content-end">
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
                                        responsiveLayout="scroll"
                                        loading={isLoading || isFetching}
                                        dataKey="id"
                                        emptyMessage={<div className="text-center p-3">No funding requests found.</div>}
                                        onRowClick={(e) => handleView(e.data)}
                                        rowClassName={() => 'cursor-pointer'}
                                    >
                                        <Column field="funding_type" header="Funding Type" sortable body={(row) => row.funding_type || 'N/A'} headerStyle={{ minWidth: '160px' }}></Column>
                                        <Column field="use_of_funds" header="Uses" sortable body={(row) => row.use_of_funds || 'N/A'} headerStyle={{ minWidth: '150px' }}></Column>
                                        <Column field="requested_amount" header="Requested Amount" sortable body={(row) => row.requested_amount || 'N/A'} headerStyle={{ minWidth: '140px' }}></Column>
                                        <Column field="amount_range" header="Estimated Amount" sortable body={(row) => row.funding_sequence?.amount_range || 'N/A'} headerStyle={{ minWidth: '160px' }}></Column>
                                        <Column field="status" header="Request Status" sortable body={statusBodyTemplate} headerStyle={{ minWidth: '180px' }}></Column>
                                        <Column field="application_status" header="Application Status" body={applicationStatusTemplate} headerStyle={{ minWidth: '170px' }}></Column>
                                        <Column field="created_at" header="Created At" sortable body={(row) => row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'} headerStyle={{ minWidth: '120px' }}></Column>
                                        <Column header="Actions" headerStyle={{ minWidth: '280px' }} bodyStyle={{ minWidth: '280px' }} body={(row: any) => {
                                            const isApproved = row.status === FUNDING_REVIEW_STATUS.APPROVED;
                                            const isRejected = row.status === FUNDING_REVIEW_STATUS.REJECTED;
                                            const appStatus = (row.application_status || '').toLowerCase();
                                            const isNotStarted = isApproved && !row.application_status;
                                            const isOnHoldOrDraft = isApproved && (appStatus.includes('hold') || appStatus.includes('draft'));
                                            // Submitted and still editable: status key 3-9 (the server decides).
                                            const isPendingReview = Boolean(row.application_status && row.application_is_editable && !appStatus.includes('hold') && !appStatus.includes('draft'));
                                            const isSubmittedOrComplete = Boolean(row.application_status && !isOnHoldOrDraft && !isPendingReview);

                                            return (
                                                <div className="d-flex gap-2 align-items-center flex-nowrap">
                                                    <button
                                                        className="btn btn-sm btn-primary text-nowrap d-inline-flex align-items-center"
                                                        onClick={() => handleView(row)}
                                                    >
                                                        <i className="ri-eye-line me-1"></i> Details
                                                    </button>
                                                    {isNotStarted && (
                                                        <Link
                                                            to={`/fund-application/${row.id}`}
                                                            className="btn btn-success btn-sm text-nowrap d-inline-flex align-items-center"
                                                            title="Process Application"
                                                        >
                                                            Process Application <i className="ri-arrow-right-line ms-1"></i>
                                                        </Link>
                                                    )}
                                                    {isOnHoldOrDraft && (
                                                        <Link
                                                            to={`/fund-application/${row.id}`}
                                                            className="btn btn-success  btn-sm text-nowrap d-inline-flex align-items-center"
                                                            title="Continue Application"
                                                        >
                                                            Continue Application <i className="ri-arrow-right-line ms-1"></i>
                                                        </Link>
                                                    )}
                                                    {isPendingReview && (
                                                        <Link
                                                            to={`/fund-application/${row.id}`}
                                                            className="btn btn-warning btn-sm py-1 fw-normal text-nowrap d-inline-flex align-items-center"
                                                            title="Editing will require you to resign the application"
                                                        >
                                                            <i className="ri-edit-line me-1"></i> Edit Application
                                                        </Link>
                                                    )}
                                                    {(isSubmittedOrComplete || isPendingReview) && (
                                                        <Link
                                                            to={row.funding_application_id ? `/my-applications/funding/${row.funding_application_id}` : '/my-applications'}
                                                            className="btn btn-info btn-sm text-nowrap d-inline-flex align-items-center"
                                                            title="View Application"
                                                        >
                                                            <i className="ri-file-list-line me-1"></i> View Application
                                                        </Link>
                                                    )}
                                                    {isRejected && (
                                                        <Link
                                                            to={`/funding/${row.funding_sequence_id || row.funding_sequence?.id}/review`}
                                                            state={{
                                                                purpose: row.use_of_funds,
                                                                amount: row.requested_amount
                                                            }}
                                                            className="btn btn-danger btn-sm text-nowrap d-inline-flex align-items-center"
                                                            title="Update Application"
                                                        >
                                                            Update Application <i className="ri-arrow-right-line ms-1"></i>
                                                        </Link>
                                                    )}
                                                </div>
                                            );
                                        }} className="fr-list-actions-col"></Column>
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

