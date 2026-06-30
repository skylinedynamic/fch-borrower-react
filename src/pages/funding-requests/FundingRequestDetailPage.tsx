import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getBorrowerFundingRequest } from '../../modules/funding-requests/services'
import { getBorrowerActivityLogs } from '../../modules/activity-log/services'
import { getFileConfig } from '../../config/fileTypeConfig'
import { FUNDING_REVIEW_STATUS } from '../../config/funding'
import { toast } from 'react-toastify'
import '../../components/Common/StatisticsCardSkeleton.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'

const formatDateTime = (d: string) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

const formatActivityTime = (dateStr: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    if (diffDays === 0) return `Today at ${timeStr}`
    if (diffDays === 1) return `Yesterday at ${timeStr}`
    return formatDate(dateStr) + ` at ${timeStr}`
}

const getActivityIcon = (logTypeRaw: string, isSuccess = false) => {
    const logType = String(logTypeRaw || '').toLowerCase();
    
    // Exact matching for funding events
    if (logType === 'funding_request_create') {
        return { icon: 'ri-file-add-line', bg: 'bg-info-subtle', color: 'text-info' };
    }
    if (logType === 'funding_request_status_update') {
        return { icon: 'ri-refresh-line', bg: 'bg-warning-subtle', color: 'text-warning' };
    }
    
    // Generic fallback matching
    if (logType.includes('create') || logType.includes('submit')) {
        return { icon: 'ri-file-add-line', bg: 'bg-primary-subtle', color: 'text-primary' };
    }
    if (logType.includes('status') || logType.includes('approve') || logType.includes('accept')) {
        if (isSuccess || logType.includes('approve') || logType.includes('accept')) {
            return { icon: 'ri-checkbox-circle-line', bg: 'bg-success-subtle', color: 'text-success' };
        }
        return { icon: 'ri-close-circle-line', bg: 'bg-danger-subtle', color: 'text-danger' };
    }
    if (logType.includes('comment')) {
        return { icon: 'ri-chat-3-line', bg: 'bg-warning-subtle', color: 'text-warning' };
    }
    if (logType.includes('document') || logType.includes('upload')) {
        return { icon: 'ri-folder-2-line', bg: 'bg-info-subtle', color: 'text-info' };
    }
    if (logType.includes('invoice')) {
        return { icon: 'ri-file-list-3-line', bg: 'bg-secondary-subtle', color: 'text-secondary' };
    }
    if (logType.includes('email')) {
        return { icon: 'ri-mail-send-line', bg: 'bg-primary-subtle', color: 'text-primary' };
    }
    
    // Default
    return { icon: 'ri-time-line', bg: 'bg-secondary-subtle', color: 'text-secondary' };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    if (status === FUNDING_REVIEW_STATUS.APPROVED || status === 'Accepted')
        return <span className="badge bg-success-subtle text-success fs-12">{status}</span>
    if (status === FUNDING_REVIEW_STATUS.REJECTED)
        return <span className="badge bg-danger-subtle text-danger fs-12">Rejected</span>
    if (status === 'In Progress')
        return <span className="badge bg-info-subtle text-info fs-12">In Progress</span>
    return <span className="badge bg-warning-subtle text-warning fs-12">Pending</span>
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f0f2f5 25%, #e6e8eb 37%, #f0f2f5 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: 6,
    display: 'inline-block',
}

const Skeleton = ({ w, h, rounded = false }: { w: number | string; h: number; rounded?: boolean }) => (
    <div style={{ ...shimmerStyle, width: w, height: h, borderRadius: rounded ? 999 : 6 }} />
)

// ─── Activity Item Component ──────────────────────────────────────────────────
interface ActivityItemProps {
    activity: any
    review: any
    isFirst: boolean
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, review, isFirst }) => {
    const [expanded, setExpanded] = useState(false) // All items collapsed by default

    const logTypeRaw = activity.log_type_raw || ''
    const title = activity.event_label || activity.log_type || 'Activity'
    const causedBy = activity.causer_name || 'System'
    const description = activity.description || ''
    const timestamp = formatActivityTime(activity.created_at)

    const isApprove = String(title).toLowerCase().includes('approve') || String(title).toLowerCase().includes('accept')
    const { icon, bg, color } = getActivityIcon(logTypeRaw, isApprove)

    const toggleExpand = () => setExpanded(!expanded)

    // Category / Sequence badge
    const categoryName = review.funding_sequence?.name || review.funding_type || 'Business credit builder cards'

    return (
        <div className="d-flex timeline-item-row position-relative mb-4 pb-2">
            {/* Left timeline dot */}
            <div className="timeline-dot-container me-3 position-relative" style={{ zIndex: 2 }}>
                <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center ${bg} ${color} shadow-sm border border-white`} style={{ width: 36, height: 36 }}>
                    <i className={`${icon} fs-16`}></i>
                </div>
            </div>

            {/* Main content body */}
            <div className="flex-grow-1 card border shadow-none mb-0 rounded-3 bg-white" style={{ minWidth: 0 }}>
                <div className="card-body p-3">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                        <div style={{ minWidth: 0 }} onClick={toggleExpand} className="cursor-pointer flex-grow-1">
                            {/* Title */}
                            <h6 className="mb-0 fw-bold text-dark fs-13">{title}</h6>
                            
                            {/* Subtitle / Meta */}
                            <p className="mb-2 text-muted fs-11 mt-1 d-flex align-items-center flex-wrap">
                                <span>by {causedBy}</span>
                                <span style={{ margin: '0 6px' }}>•</span>
                                <i className="ri-time-line align-middle me-1 fs-11 text-muted" style={{ marginRight: '2px' }}></i>
                                <span>{timestamp}</span>
                            </p>

                            {/* Short Snippet / Description */}
                            {description && (
                                <p className="mb-2 text-muted fs-12" dangerouslySetInnerHTML={{ __html: description }} />
                            )}

                            {/* Category Badge */}
                            {isFirst && categoryName && (
                                <span className="badge fs-10 rounded-pill px-2 py-0.5 mt-1" style={{ backgroundColor: '#e2e8f0', color: '#1e3a8a' }}>
                                    {categoryName}
                                </span>
                            )}
                        </div>

                        {/* Chevron collapse trigger on the right */}
                        <button 
                            onClick={toggleExpand}
                            className="btn btn-light rounded-circle shadow-none flex-shrink-0 align-self-start d-flex align-items-center justify-content-center"
                            style={{ 
                                width: '28px', 
                                height: '28px', 
                                minWidth: '28px',
                                minHeight: '28px',
                                background: '#f1f5f9',
                                border: 'none',
                                color: '#64748b',
                                padding: 0
                            }}
                        >
                            <i className={`ri-arrow-${expanded ? 'up' : 'down'}-s-line fs-14`}></i>
                        </button>
                    </div>

                    {/* Smooth transition expanded content details */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateRows: expanded ? '1fr' : '0fr',
                            transition: 'grid-template-rows 0.3s ease',
                        }}
                    >
                        <div>
                            <div className="mt-3 pt-3 border-top border-light-subtle">
                                {isFirst ? (
                                    /* Request details layout (Adapted for sidebar width) */
                                    <div>
                                        <div className="pt-3 border-top border-light-subtle mb-3">
                                            <h6 className="fw-semibold text-dark fs-13 mb-3">Request Details</h6>
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <p className="fs-11 text-muted mb-1">Amount Requested</p>
                                                    <h6 className="mb-0 fw-semibold text-dark fs-13">
                                                        {review.requested_amount ? `$${Number(review.requested_amount).toLocaleString()}` : 'N/A'}
                                                    </h6>
                                                </div>
                                                <div className="col-6">
                                                    <p className="fs-11 text-muted mb-1">Funding Purpose</p>
                                                    <h6 className="mb-0 fw-semibold text-dark fs-13">{review.use_of_funds || 'Working Capital'}</h6>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isApprove ? (
                                    /* Approval details layout */
                                    <div>
                                        <h6 className="fw-semibold text-dark fs-12 mb-2">Approval Details</h6>
                                        <div className="row g-2 bg-light rounded-3 p-2.5 mb-2 mx-0">
                                            <div className="col-6">
                                                <p className="text-muted fs-10 text-uppercase mb-0.5">Approved By</p>
                                                <h6 className="mb-0 fw-bold text-dark fs-12">{review.reviewer?.name || causedBy}</h6>
                                            </div>
                                            <div className="col-6">
                                                <p className="text-muted fs-10 text-uppercase mb-0.5">Funding sequence</p>
                                                <h6 className="mb-0 fw-bold text-dark fs-12 text-truncate">{categoryName}</h6>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Generic log info */
                                    <div className="p-1">
                                        <p className="text-muted fs-12 mb-0">No additional details are available for this action.</p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FundingRequestDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    
    const [review, setReview] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Activity log list states
    const [activities, setActivities] = useState<any[]>([])
    const [actPage, setActPage] = useState(1)
    const [actHasMore, setActHasMore] = useState(true)
    const [actLoading, setActLoading] = useState(true)
    const [actLoadingMore, setActLoadingMore] = useState(false)
    const [totalActivities, setTotalActivities] = useState(0)

    // Filtering Tabs state
    const [filterTab, setFilterTab] = useState<'all' | 'funding' | 'comments' | 'updates'>('all')
    const activityRef = useRef<HTMLDivElement>(null)

    // Load request details
    useEffect(() => {
        if (!id) return
        setLoading(true)
        getBorrowerFundingRequest(Number(id))
            .then(res => {
                if (res.success) setReview(res.data)
                else toast.error(res.message || 'Failed to load details')
            })
            .catch(() => toast.error('Failed to load details'))
            .finally(() => setLoading(false))
    }, [id])

    // Load activity logs
    const loadActivities = useCallback((page: number, append = false) => {
        if (!id) return
        if (page === 1) setActLoading(true)
        else setActLoadingMore(true)

        getBorrowerActivityLogs({ funding_request_id: id, page, per_page: 10 })
            .then(res => {
                const items: any[] = res?.data?.data || res?.data || []
                const meta = res?.data?.meta || {}
                setActivities(prev => append ? [...prev, ...items] : items)
                setActHasMore(meta.current_page < meta.last_page)
                setTotalActivities(meta.total || items.length)
            })
            .catch(() => {})
            .finally(() => { setActLoading(false); setActLoadingMore(false) })
    }, [id])

    useEffect(() => { loadActivities(1) }, [loadActivities])

    const loadMore = () => {
        if (actLoadingMore || !actHasMore) return
        const next = actPage + 1
        setActPage(next)
        loadActivities(next, true)
    }

    // Filter activities list based on tab
    const getFilteredActivities = () => {
        return activities.filter(act => {
            const raw = String(act.log_type_raw || '').toLowerCase()
            const name = String(act.event_label || act.log_type || '').toLowerCase()
            if (filterTab === 'funding') {
                return raw.includes('funding_request') || name.includes('funding')
            }
            if (filterTab === 'comments') {
                return raw.includes('comment') || name.includes('comment')
            }
            if (filterTab === 'updates') {
                return raw.includes('update') || name.includes('update') || raw.includes('status')
            }
            return true
        })
    }

    if (loading) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <Skeleton w={200} h={16} /><br /><br />
                    <div className="row g-4">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm p-4">
                                <Skeleton w="40%" h={22} /><br />
                                <Skeleton w="100%" h={15} /><br /><br />
                                <Skeleton w="80%" h={12} />
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm p-4">
                                <Skeleton w="60%" h={20} /><br />
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="mb-3"><Skeleton w="100%" h={12} /></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!review) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <i className="ri-file-unknow-line fs-1 text-muted d-block mb-3" />
                            <h6 className="fw-semibold text-dark mb-1">Request not found</h6>
                            <button onClick={() => navigate('/funding-requests')} className="btn btn-dark btn-sm mt-3">
                                Back to Funding Requests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const filtered = getFilteredActivities()
    const reviewId = review.id ? `FR-2024-${String(review.id).padStart(5, '0')}` : ''

    // Compute dynamic tab counts
    const countFunding = activities.filter(a => String(a.log_type_raw || '').includes('funding_request') || String(a.event_label || '').toLowerCase().includes('funding')).length
    const countComments = activities.filter(a => String(a.log_type_raw || '').includes('comment')).length
    const countUpdates = activities.filter(a => String(a.log_type_raw || '').includes('update') || String(a.log_type_raw || '').includes('status')).length

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* ── Header / Breadcrumb ─────────────────────────────────── */}
                <div className="row pb-1 page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Request Detail</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0 fs-12 text-muted">
                                        <li className="breadcrumb-item"><Link to="/" className="text-muted">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding-requests" className="text-muted">Funding Requests</Link></li>
                                        <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">{reviewId}</li>
                                    </ol>
                                </nav>
                            </div>
                            <Link to="/funding-requests" className="btn btn-outline-secondary btn-sm shadow-none">
                                <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Two Column Page Layout ─────────────────────────────── */}
                <div className="row g-4 mt-1">

                    {/* ── Left Column: Details Cards (Summary, Documents, Decision) ── */}
                    <div className="col-lg-8">
                        {/* Summary Card */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar-sm">
                                            <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                                                <i className="ri-file-text-line"></i>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="mb-0 fw-bold fs-16">{reviewId}</h5>
                                            <p className="mb-0 text-muted fs-12">Submitted on {formatDate(review.created_at)}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={review.status} />
                                </div>
                            </div>
                            <div className="card-body px-4 pb-4 pt-4">
                                <div className="row g-3">
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3">
                                            <p className="text-muted fs-11 fw-semibold text-uppercase mb-1">Funding Type</p>
                                            <p className="mb-0 fw-semibold text-dark fs-14">{review.funding_sequence?.name || review.funding_type || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3">
                                            <p className="text-muted fs-11 fw-semibold text-uppercase mb-1">Requested Amount</p>
                                            <p className="mb-0 fw-semibold text-dark fs-14">
                                                {review.requested_amount ? `$${Number(review.requested_amount).toLocaleString()}` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3">
                                            <p className="text-muted fs-11 fw-semibold text-uppercase mb-1">Use of Funds</p>
                                            <p className="mb-0 fw-semibold text-dark fs-14">{review.use_of_funds || 'Working Capital'}</p>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3">
                                            <p className="text-muted fs-11 fw-semibold text-uppercase mb-1">Estimated Amount</p>
                                            <p className="mb-0 fw-semibold text-dark fs-14">
                                                {review.funding_sequence?.amount_range || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents Card */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                <h6 className="mb-0 fw-bold fs-15">
                                    <i className="ri-folder-2-line me-2 text-primary"></i>
                                    Uploaded Documents
                                    {review.actual_documents?.length > 0 && (
                                        <span className="ms-2 badge bg-success-subtle text-success border border-success-subtle">
                                            {review.actual_documents.length} Attached
                                        </span>
                                    )}
                                </h6>
                            </div>
                            <div className="card-body px-4 pb-4 pt-3">
                                {review.actual_documents && review.actual_documents.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-nowrap align-middle mb-0">
                                            <thead className="table-light text-muted">
                                                <tr>
                                                    <th className="text-start">Document Name</th>
                                                    <th className="text-center">Status</th>
                                                    <th className="text-end">Upload Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {review.actual_documents.map((doc: any, idx: number) => {
                                                    const config = getFileConfig(doc.document_url || doc.file_path || doc.document_name || '')
                                                    return (
                                                        <tr key={idx} className="border-bottom border-bottom-dashed">
                                                            <td className="text-start fw-medium text-dark">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-xs flex-shrink-0 me-2">
                                                                        <div className={`avatar-title ${config.bg} ${config.color} rounded fs-16`}>
                                                                            <i className={config.icon}></i>
                                                                        </div>
                                                                    </div>
                                                                    <a href={doc.document_url || '#'} target="_blank" rel="noreferrer"
                                                                        className="text-body fw-medium text-truncate d-block" style={{ maxWidth: 260 }}>
                                                                        {doc.document_name}
                                                                    </a>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                {doc.status === 'Accepted' ? (
                                                                    <span className="badge bg-success-subtle text-success">Accepted</span>
                                                                ) : doc.status === 'Rejected' ? (
                                                                    <span className="badge bg-danger-subtle text-danger">Rejected</span>
                                                                ) : doc.status === 'Under Review' ? (
                                                                    <span className="badge bg-warning-subtle text-warning">Under Review</span>
                                                                ) : (
                                                                    <span className="badge bg-info-subtle text-info">Uploaded</span>
                                                                )}
                                                            </td>
                                                            <td className="text-end text-muted fs-12">
                                                                {formatDateTime(doc.created_at)}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted">
                                        <i className="ri-folder-open-line fs-2 d-block mb-2"></i>
                                        <p className="mb-0 fs-13">No documents uploaded.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Decision Details */}
                        {review.status !== FUNDING_REVIEW_STATUS.PENDING && (
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                    <h6 className="mb-0 fw-bold fs-15">
                                        <i className="ri-shield-check-line me-2 text-success"></i>
                                        Decision Details
                                    </h6>
                                </div>
                                <div className="card-body px-4 pb-4 pt-3">
                                    <div className="row g-3">
                                        {review.reviewer?.name && (
                                            <div className="col-12">
                                                <p className="text-muted mb-1 fs-13">Reviewed By:</p>
                                                <p className="fw-semibold text-dark mb-0">{review.reviewer.name}</p>
                                            </div>
                                        )}
                                        {review.status === FUNDING_REVIEW_STATUS.REJECTED && review.reject_reason && (
                                            <div className="col-12">
                                                <div className="alert alert-danger border-0 mb-0">
                                                    <p className="mb-0 fs-13">
                                                        <span className="fw-bold">Reason for Rejection:</span>{' '}
                                                        {review.reject_reason}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {(review.status === FUNDING_REVIEW_STATUS.APPROVED || review.status === 'Accepted') && (
                                            <div className="col-12">
                                                <div className="alert alert-success border-0 mb-0">
                                                    <p className="mb-0 fs-13">
                                                        <span className="fw-bold">Approved:</span>{' '}
                                                        Your funding request has been approved for {review.funding_type}. Please proceed with the final funding application.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Column: Activity Log Timeline Sidebar ── */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            {/* Card Header */}
                            <div className="card-header bg-white border-0 px-3 pt-3 pb-0">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="ri-history-line fs-18 text-dark"></i>
                                    <h5 className="mb-0 fw-bold text-dark fs-16">Activity</h5>
                                </div>
                            </div>

                            {/* Sub-header Filter Tabs */}
                            <div className="card-body px-3 pt-3 pb-3">

                                {/* Activity Logs Timeline */}
                                <div className="timeline-container position-relative px-0" ref={activityRef}>
                                    {/* Vertical connecting line */}
                                    <div 
                                        className="timeline-vertical-line position-absolute" 
                                        style={{ 
                                            left: 18, 
                                            top: 10, 
                                            bottom: 10, 
                                            width: 2, 
                                            borderLeft: '2px dashed #e9ecef', 
                                            zIndex: 1 
                                        }}
                                    />

                                    {actLoading ? (
                                        <div className="py-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="d-flex gap-2.5 mb-3">
                                                    <Skeleton w={36} h={36} rounded />
                                                    <div className="flex-grow-1">
                                                        <Skeleton w="60%" h={12} /><br />
                                                        <Skeleton w="90%" h={10} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ri-history-line fs-24 d-block mb-1 text-muted opacity-50"></i>
                                            <p className="mb-0 fs-12 fw-semibold">No activities found.</p>
                                        </div>
                                    ) : (
                                        <div className="timeline-list">
                                            {filtered.map((act, index) => (
                                                <ActivityItem 
                                                    key={act.id} 
                                                    activity={act} 
                                                    review={review}
                                                    isFirst={index === filtered.length - 1} // Submit event is first (last in array)
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination / Load More Footer */}
                                {actHasMore && filtered.length > 0 && (
                                    <div className="text-center mt-4 mb-2">
                                        <button
                                            className="btn bg-white border rounded-pill shadow-none d-inline-flex align-items-center justify-content-center gap-1 fw-medium"
                                            style={{ fontSize: '12px', color: '#2563eb', padding: '6px 16px', borderColor: '#e2e8f0' }}
                                            onClick={loadMore}
                                            disabled={actLoadingMore}
                                        >
                                            {actLoadingMore ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Loading...</>
                                            ) : (
                                                <>Load More Activities <i className="ri-arrow-down-s-line fs-14 align-middle"></i></>
                                            )}
                                        </button>
                                        <p className="text-muted mt-2 mb-0" style={{ fontSize: '10px' }}>Showing {filtered.length} of {totalActivities} activities</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
