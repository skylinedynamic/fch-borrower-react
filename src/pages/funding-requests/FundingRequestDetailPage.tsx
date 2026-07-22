import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getBorrowerFundingRequest } from '../../modules/funding-requests/services'
import { getBorrowerActivityLogs, downloadActivityAttachment } from '../../modules/activity-log/services'
import { downloadBorrowerDocument } from '../../modules/documents/services'
import { downloadBlob, downloadFileFromUrl, handleFileDownload } from '../../utils/fileDownload'
import { getFileConfig, getDocumentStatusBadgeClass } from '../../config/fileTypeConfig'
import { FUNDING_REVIEW_STATUS, FUNDING_REVIEW_STATUS_COLORS } from '../../config/funding'
import { toast } from 'react-toastify'
import FileUploadModal from '../../components/Common/Modal/FileUploadModal'
import ReviewProgressCard from './components/ReviewProgressCard'
import '../../components/Common/StatisticsCardSkeleton.css'
import '../../../assets/css/funding-requests.css'

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
    if (status === FUNDING_REVIEW_STATUS.APPROVED)
        return <span className="badge bg-success-subtle text-success fs-12">{status}</span>
    if (status === FUNDING_REVIEW_STATUS.ACCEPTED)
        return <span className="badge bg-info-subtle text-info fs-12">{status}</span>
    if (status === FUNDING_REVIEW_STATUS.REJECTED)
        return <span className="badge bg-danger-subtle text-danger fs-12">Rejected</span>
    if (status === FUNDING_REVIEW_STATUS.CANCELED)
        return <span className="badge bg-secondary-subtle text-secondary fs-12">Canceled</span>
    if (status === FUNDING_REVIEW_STATUS.IN_PROGRESS)
        return <span className="badge bg-primary-subtle text-primary fs-12">In Progress</span>
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

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();

        const configKey = Object.keys(FUNDING_REVIEW_STATUS_COLORS).find(
            key => key.toLowerCase() === s || s.includes(key.toLowerCase())
        );
        if (configKey) {
            return FUNDING_REVIEW_STATUS_COLORS[configKey];
        }

        if (s === 'good' || s === 'strong') {
            return '#10B981';
        }
        if (s.includes('fail') || s.includes('miss')) {
            return '#EF4444';
        }
        return 'inherit';
    };

    const formatActivityTitle = (rawTitle: string) => {
        if (typeof rawTitle !== 'string') return rawTitle;

        // Check if there is an explicit old status and new status in changes/old_values
        const oldStatus = activity.old_values?.status || activity.properties?.old?.status;
        const newStatus = activity.status || activity.properties?.status;

        if (rawTitle.includes('Status Changed:') || rawTitle.includes('Status Changed') || ((rawTitle === 'Funding Request Status Updated' || rawTitle === 'Funding Request Status Changed') && oldStatus && newStatus)) {
            let prefix = 'Funding Request Status Changed:';
            let oldFormatted = oldStatus ? (oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)) : '';
            let newFormatted = newStatus ? (newStatus.charAt(0).toUpperCase() + newStatus.slice(1)) : '';

            if (rawTitle.includes('Status Changed:') || rawTitle.includes('Status Changed')) {
                const separator = rawTitle.includes('Status Changed:') ? 'Status Changed:' : 'Status Changed';
                const parts = rawTitle.split(separator);
                prefix = (parts[0] + separator).trim();
                const statusPart = parts.slice(1).join(separator).trim();

                const arrow = statusPart.includes('→') ? '→' : (statusPart.includes('->') ? '->' : null);
                if (arrow) {
                    const statuses = statusPart.split(arrow);
                    oldFormatted = statuses[0].trim();
                    newFormatted = statuses[1].trim();
                } else {
                    oldFormatted = '';
                    newFormatted = statusPart;
                }
            }

            if (oldFormatted && newFormatted) {
                return (
                    <span className="d-block" style={{ lineHeight: '1.4' }}>
                        <span className="text-dark fw-bold d-block">{prefix}</span>
                        <span className="d-inline-flex align-items-center flex-wrap gap-1 mt-1">
                            <span style={{ color: getStatusColor(oldFormatted), fontWeight: '700' }}>{oldFormatted}</span>
                            <span className="text-muted px-1" style={{ fontSize: '11px' }}>→</span>
                            <span style={{ color: getStatusColor(newFormatted), fontWeight: '700' }}>{newFormatted}</span>
                        </span>
                    </span>
                );
            } else if (newFormatted) {
                return (
                    <span className="d-block" style={{ lineHeight: '1.4' }}>
                        <span className="text-dark fw-bold d-block">{prefix}</span>
                        <span style={{ color: getStatusColor(newFormatted), fontWeight: '700' }} className="d-block mt-1">{newFormatted}</span>
                    </span>
                );
            }
        }

        // Support direct formats like "Funding Request InProgress to Pending Status Updated"
        if (rawTitle.includes('InProgress to Pending')) {
            return (
                <span className="d-block" style={{ lineHeight: '1.4' }}>
                    <span className="text-dark fw-bold d-block">Funding Request Status Changed:</span>
                    <span className="d-inline-flex align-items-center flex-wrap gap-1 mt-1">
                        <span style={{ color: getStatusColor('In Progress'), fontWeight: '700' }}>In Progress</span>
                        <span className="text-muted px-1" style={{ fontSize: '11px' }}>→</span>
                        <span style={{ color: getStatusColor('Pending'), fontWeight: '700' }}>Pending</span>
                    </span>
                </span>
            );
        }

        return rawTitle;
    };

    const handleDownload = async (activityId: number | string, file: any) => {
        try {
            const fileName = file.name || file;
            const filePath = file.path || file;

            if (!filePath) {
                console.error('No file path available for download');
                return;
            }

            const blob = await downloadActivityAttachment({
                activity_log_id: activityId,
                path: filePath
            });

            downloadBlob(blob, fileName);
        } catch (error) {
            console.error('Error downloading attachment:', error);
            toast.error('Failed to download attachment');
        }
    };

    // Category / Sequence badge
    const categoryName = review.funding_sequence?.name || review.funding_type || 'Business credit builder cards'

    return (
        <div className="d-flex timeline-item-row position-relative mb-2">
            {/* Left timeline dot */}
            <div className="timeline-dot-container me-3 position-relative" style={{ zIndex: 2, marginTop: '2px' }}>
                <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center ${bg} ${color} shadow-sm border border-white`} style={{ width: 36, height: 36 }}>
                    <i className={`${icon} fs-16`}></i>
                </div>
            </div>

            {/* Main content body */}
            <div className="flex-grow-1 border-0 mb-0" style={{ minWidth: 0 }}>
                <div className="p-1">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                        <div style={{ minWidth: 0 }} onClick={toggleExpand} className="cursor-pointer flex-grow-1">
                            {/* Title */}
                            <h6 className="mb-0 fw-bold text-dark fs-13">{formatActivityTitle(title)}</h6>

                            {/* Subtitle / Meta */}
                            <p className="mb-2 text-muted fs-11 mt-1 d-flex align-items-center gap-1">
                                <i className="ri-time-line text-muted fs-11"></i>
                                <span>{timestamp}</span>
                            </p>

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
                    <div className="fr-accordion-panel"
                        style={{
                            gridTemplateRows: expanded ? '1fr' : '0fr',
                        }}
                    >
                        <div className="fr-accordion-panel-inner" style={{ overflow: 'hidden', paddingLeft: '2px' }}>
                            <div className={isFirst || isApprove ? "mt-3 pt-3 border-top border-light-subtle" : "mt-2"}>
                                {isFirst ? (
                                    /* Request details layout (Adapted for sidebar width) */
                                    <div className="pt-1">
                                        <h6 className="activity-section-title">
                                            Request Details
                                        </h6>

                                        <div className="activity-detail-card mb-2">

                                            <div className="row g-0">

                                                <div className="col-6 activity-detail-item">
                                                    <p className="activity-detail-label">
                                                        Amount Requested
                                                    </p>

                                                    <h6 className="activity-detail-value">
                                                        {review.requested_amount || 'N/A'}
                                                    </h6>
                                                </div>

                                                <div className="col-6 activity-detail-item">
                                                    <p className="activity-detail-label">
                                                        Funding Purpose
                                                    </p>

                                                    <h6 className="activity-detail-value text-truncate">
                                                        {review.use_of_funds || 'Working Capital'}
                                                    </h6>
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                ) : isApprove ? (
                                    /* Approval details layout */
                                    <div className="pt-1">
                                        <h6 className="activity-section-title">
                                            Approval Details
                                        </h6>

                                        <div className="activity-detail-card mb-2">

                                            <div className="row g-0">

                                                <div className="col-6 activity-detail-item">
                                                    <p className="activity-detail-label">
                                                        Approved By
                                                    </p>

                                                    <h6 className="activity-detail-value">
                                                        {review.reviewer?.name || causedBy}
                                                    </h6>
                                                </div>

                                                <div className="col-6 activity-detail-item">
                                                    <p className="activity-detail-label">
                                                        Funding Sequence
                                                    </p>

                                                    <h6 className="activity-detail-value text-truncate">
                                                        {categoryName}
                                                    </h6>
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                ) : (
                                    /* Generic log info with description and attachments */
                                    <div className="p-1">
                                        {description ? (
                                            <div
                                                className="text-muted mb-2 fs-13"
                                                dangerouslySetInnerHTML={{ __html: description }}
                                            />
                                        ) : (!activity.attachments || activity.attachments.length === 0) ? (
                                            <p className="text-muted fs-12 mb-0">No additional details are available for this action.</p>
                                        ) : null}

                                        {activity.attachments && activity.attachments.length > 0 && (
                                            <div className="row g-2 mt-1">
                                                {activity.attachments.map((file: any, fIdx: number) => {
                                                    const fileName = file.name || file;
                                                    return (
                                                        <div key={fIdx} className="col-auto">
                                                            <div className="d-flex align-items-center border border-dashed p-2 rounded position-relative bg-white fr-doc-item" style={{ minWidth: '120px' }}>
                                                                <div className="flex-shrink-0 me-2">
                                                                    <i className="ri-image-line fs-18 text-primary"></i>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h6 className="mb-0 fs-12 text-truncate fr-doc-filename">
                                                                        <a
                                                                            href="#"
                                                                            className="stretched-link text-body fr-doc-link"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handleDownload(activity.id, file);
                                                                            }}
                                                                        >
                                                                            {fileName}
                                                                        </a>
                                                                    </h6>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
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
        if (page === 1) {
            setActLoading(true)
            setActPage(1)
        } else {
            setActLoadingMore(true)
        }

        getBorrowerActivityLogs({ funding_request_id: id, page, limit: 10 })
            .then(res => {
                const items: any[] = res?.data || []
                const meta = res?.meta || {}

                setActivities(prev => {
                    if (!append) return items;
                    const existingIds = new Set(prev.map(item => item.id));
                    const newItems = items.filter(item => !existingIds.has(item.id));
                    return [...prev, ...newItems];
                })

                setActHasMore(meta.current_page < meta.last_page)
                setTotalActivities(meta.total || items.length)
            })
            .catch(() => { })
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
            <React.Fragment>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .activity-scroll-container::-webkit-scrollbar { width: 5px; }
                    .activity-scroll-container::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                    .activity-scroll-container::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                    .activity-scroll-container::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
                    `
                }} />
                <div className="page-content funding-requests-page">
                    <div className="container-fluid">
                        {/* Skeleton Breadcrumb */}
                        <div className="row pb-1 page-subheader-sticky bg-body">
                            <div className="col-12">
                                <div className="d-flex align-items-center justify-content-between flex-row py-2">
                                    <div className="flex-grow-1">
                                        <div className="mb-2"><Skeleton w={200} h={24} /></div>
                                        <div><Skeleton w={280} h={14} /></div>
                                    </div>
                                    <div className="mt-0">
                                        <Skeleton w={70} h={30} rounded={false} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skeleton Layout */}
                        <div className="row g-4 mt-1">
                            {/* Left Column */}
                            <div className="col-lg-8">
                                {/* Review Progress Card Skeleton */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body p-0">
                                        <div className="p-4 d-flex justify-content-between align-items-center border-bottom border-light">
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <Skeleton w={48} h={48} rounded />
                                                </div>
                                                <div>
                                                    <div className="mb-2"><Skeleton w={150} h={18} /></div>
                                                    <div><Skeleton w={220} h={14} /></div>
                                                </div>
                                            </div>
                                            <div>
                                                <Skeleton w={76} h={76} rounded />
                                            </div>
                                        </div>
                                        <div className="p-4 pt-5 pb-5 overflow-hidden">
                                            <div className="d-flex justify-content-between align-items-start position-relative px-3">
                                                {[1, 2, 3, 4, 5].map((_, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <div className="d-flex flex-column align-items-center position-relative fr-detail-step-col">
                                                            <div className="mb-2"><Skeleton w={36} h={36} rounded /></div>
                                                            <div className="mb-1"><Skeleton w={70} h={14} /></div>
                                                            <div className="mt-1"><Skeleton w={90} h={10} /></div>
                                                            <div className="mt-1"><Skeleton w={110} h={10} /></div>
                                                        </div>
                                                        {idx < 4 && (
                                                            <div className="flex-grow-1 fr-detail-step-connector"></div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decision Details Skeleton */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                        <div className="d-flex align-items-center gap-2">
                                            <Skeleton w={16} h={16} rounded />
                                            <Skeleton w={120} h={18} />
                                        </div>
                                    </div>
                                    <div className="card-body px-4 pb-4 pt-3">
                                        <div className="mb-3">
                                            <div className="mb-2"><Skeleton w={100} h={14} /></div>
                                            <Skeleton w={150} h={16} />
                                        </div>
                                        <Skeleton w="100%" h={60} rounded />
                                    </div>
                                </div>

                                {/* Summary Card Skeleton */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <Skeleton w={36} h={36} rounded />
                                                <div>
                                                    <div className="mb-2"><Skeleton w={140} h={18} /></div>
                                                    <div><Skeleton w={100} h={12} /></div>
                                                </div>
                                            </div>
                                            <Skeleton w={70} h={20} />
                                        </div>
                                    </div>
                                    <div className="card-body px-4 pb-4 pt-4">
                                        <div className="row g-3">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="col-sm-6">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <div className="mb-2"><Skeleton w={120} h={14} /></div>
                                                        <div><Skeleton w={160} h={18} /></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Card Skeleton */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                        <div className="d-flex align-items-center gap-2">
                                            <Skeleton w={16} h={16} rounded />
                                            <Skeleton w={160} h={18} />
                                            <Skeleton w={70} h={20} />
                                        </div>
                                    </div>
                                    <div className="card-body px-4 pb-4 pt-4">
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
                                                    {[1, 2].map(i => (
                                                        <tr key={i}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Skeleton w={24} h={24} rounded />
                                                                    <Skeleton w={140} h={14} />
                                                                </div>
                                                            </td>
                                                            <td><Skeleton w={60} h={20} /></td>
                                                            <td><Skeleton w={100} h={14} /></td>
                                                            <td><Skeleton w={70} h={30} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Activity Log Skeleton */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-3">
                                    <div className="card-header bg-white border-0 px-3 pt-3 pb-0">
                                        <div className="d-flex align-items-center gap-2">
                                            <Skeleton w={18} h={18} rounded />
                                            <Skeleton w={80} h={20} />
                                        </div>
                                    </div>
                                    <div className="card-body px-3 pt-4 pb-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="d-flex align-items-start p-2 mb-2">
                                                <div className="me-3 flex-shrink-0">
                                                    <Skeleton w={36} h={36} rounded />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="mb-2"><Skeleton w="60%" h={14} /></div>
                                                    <div><Skeleton w="40%" h={12} /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
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
    const pageTitle = 'Funding Request Details'

    // Compute dynamic tab counts
    const countFunding = activities.filter(a => String(a.log_type_raw || '').includes('funding_request') || String(a.event_label || '').toLowerCase().includes('funding')).length
    const countComments = activities.filter(a => String(a.log_type_raw || '').includes('comment')).length
    const countUpdates = activities.filter(a => String(a.log_type_raw || '').includes('update') || String(a.log_type_raw || '').includes('status')).length

    return (
        <React.Fragment>
            <style dangerouslySetInnerHTML={{
                __html: `
                .activity-scroll-container::-webkit-scrollbar { width: 5px; }
                .activity-scroll-container::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .activity-scroll-container::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .activity-scroll-container::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
                `
            }} />
            <div className="page-content funding-requests-page">
                <div className="container-fluid">

                    {/* ── Header / Breadcrumb ─────────────────────────────────── */}
                    <div className="row pb-1 page-subheader-sticky bg-body">
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-between flex-row py-2">
                                <div className="flex-grow-1">
                                    <h4 className="fs-20 mb-1">{pageTitle}</h4>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb m-0 fs-12 text-muted">
                                            <li className="breadcrumb-item"><Link to="/" className="text-muted">Dashboard</Link></li>
                                            <li className="breadcrumb-item"><Link to="/funding-requests" className="text-muted">Funding Requests</Link></li>
                                            <li className="breadcrumb-item active text-primary font-weight-bold" aria-current="page">{pageTitle}</li>
                                        </ol>
                                    </nav>
                                </div>
                                <div className="mt-0">
                                    <Link to="/funding-requests" className="btn fr-back-btn px-3 shadow-none">
                                        &larr; Back
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Two Column Page Layout ─────────────────────────────── */}
                    <div className="row g-4 mt-1">

                        {/* ── Left Column: Details Cards (Summary, Documents, Decision) ── */}
                        <div className="col-lg-8">
                            <ReviewProgressCard 
                                status={review.status} 
                                createdAt={review.created_at} 
                                updatedAt={review.updated_at}
                                rejectReason={review.reject_reason} 
                            />

                            {/* Decision Details */}
                            {(review.reviewer?.name || [FUNDING_REVIEW_STATUS.APPROVED, FUNDING_REVIEW_STATUS.REJECTED, 'Accepted'].includes(review.status)) && (
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                                        <h6 className="mb-0 fw-bold fs-15">
                                            <i className={`ri-shield-check-line me-2 ${review.status === FUNDING_REVIEW_STATUS.REJECTED ? 'text-danger' : 'text-success'}`}></i>
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
                                            {review.status === FUNDING_REVIEW_STATUS.REJECTED && (
                                                <div className="col-12">
                                                    <div className="alert alert-danger border-0 mb-0">
                                                        <p className="mb-0 fs-13">
                                                            <span className="fw-bold">Status:</span> Your funding request was rejected.
                                                            {review.reject_reason && (
                                                                <>
                                                                    <br />
                                                                    <span className="fw-bold mt-1 d-inline-block">Reason for Rejection:</span>{' '}
                                                                    {review.reject_reason}
                                                                </>
                                                            )}
                                                        </p>
                                                        <div className="mt-3">
                                                            <Link 
                                                                to={`/funding/${review.funding_sequence_id || review.funding_sequence?.id}/review`}
                                                                state={{
                                                                    purpose: review.use_of_funds,
                                                                    amount: review.requested_amount
                                                                }}
                                                                className="btn btn-danger btn-sm fw-medium px-4 d-inline-flex align-items-center"
                                                            >
                                                                Update Application
                                                                <i className="ri-arrow-right-line ms-2"></i>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {review.status === FUNDING_REVIEW_STATUS.APPROVED && (
                                                <div className="col-12">
                                                    <div className="alert alert-success border-0 mb-0">
                                                        <p className="mb-0 fs-13">
                                                            <span className="fw-bold">Approved:</span>{' '}
                                                            Your funding request has been approved for {review.funding_type}. Please proceed with the final funding application.
                                                        </p>
                                                        <div className="mt-3">
                                                            <Link 
                                                                to="/fund-application"
                                                                state={{
                                                                    purpose: review.use_of_funds,
                                                                    amount: review.requested_amount,
                                                                    requested_amount: review.requested_amount,
                                                                    approved_funding: review.funding_sequence?.name || review.funding_type,
                                                                    funding_type: review.funding_type || review.funding_sequence?.name,
                                                                    funding_sequence_id: review.funding_sequence_id,
                                                                    funding_request_id: review.id,
                                                                }}
                                                                className="btn btn-success btn-sm fw-medium px-4 d-inline-flex align-items-center"
                                                            >
                                                                Process Funding Application
                                                                <i className="ri-arrow-right-line ms-2"></i>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                <h5 className="mb-0 fw-bold fs-16">{pageTitle}</h5>
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
                                                    {review.requested_amount || 'N/A'}
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
                                                        <th className="text-center">Upload Date</th>
                                                        <th className="text-end">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {review.actual_documents.map((doc: any, idx: number) => {
                                                        const config = getFileConfig(doc.document_url || doc.file_path || doc.document_name || '')

                                                        const handleDownload = (e: React.MouseEvent) => {
                                                            e.preventDefault();
                                                            let fileName = doc.document_name || 'document';
                                                            const ext = (doc.document_url?.split(/[#?]/)[0].split('.').pop() || '').trim().toLowerCase();
                                                            if (ext && !fileName.toLowerCase().endsWith(`.${ext}`)) {
                                                                fileName += `.${ext}`;
                                                            }

                                                            if (doc.id && !String(doc.id).startsWith('missing_')) {
                                                                handleFileDownload(
                                                                    () => downloadBorrowerDocument(doc.id),
                                                                    fileName,
                                                                    doc.document_url
                                                                );
                                                            } else if (doc.document_url) {
                                                                downloadFileFromUrl(doc.document_url, fileName);
                                                            } else {
                                                                toast.error('Unable to download this document.');
                                                            }
                                                        };

                                                        return (
                                                            <tr key={idx} className="border-bottom border-bottom-dashed">
                                                                <td className="text-start fw-medium text-dark">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="avatar-xs flex-shrink-0 me-2">
                                                                            <div className={`avatar-title ${config.bg} ${config.color} rounded fs-16`}>
                                                                                <i className={config.icon}></i>
                                                                            </div>
                                                                        </div>
                                                                        <a href="#" onClick={handleDownload} className="text-body fw-medium text-truncate d-block fr-doc-link">
                                                                            {doc.document_name}
                                                                        </a>
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <span className={`badge ${getDocumentStatusBadgeClass(doc.status)}`}>
                                                                        {doc.status || 'Uploaded'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center text-muted fs-12">
                                                                    {formatDateTime(doc.created_at)}
                                                                </td>
                                                                <td className="text-end">
                                                                    <div className="d-flex gap-2 justify-content-end">
                                                                        <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center fr-download-btn" onClick={handleDownload} title="Download">
                                                                            <i className="ri-download-2-line fs-14"></i>
                                                                        </button>
                                                                    </div>
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

                        </div>

                        {/* ── Right Column: Activity Log Timeline Sidebar ── */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm rounded-3 sticky-top activity-sidebar-sticky">
                                {/* Card Header */}
                                <div className="card-header px-3 py-2 align-items-center justify-content-between d-flex flex-column flex-sm-row gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ri-history-line fs-18 text-dark"></i>
                                        <h5 className="mb-0 fw-bold text-dark fs-16">Activity</h5>
                                    </div>
                                </div>

                                {/* Sub-header Filter Tabs */}
                                <div className="card-body px-3 pt-3 pb-3 activity-scroll-container fr-activity-scroll" style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden' }}>

                                    {/* Activity Logs Timeline */}
                                    <div className="timeline-container position-relative px-0" ref={activityRef}>
                                        {/* Vertical connecting line */}
                                        <div
                                            className="timeline-vertical-line position-absolute fr-timeline-vline"
                                        />

                                        {actLoading ? (
                                            <div className="py-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="d-flex align-items-start p-2 mb-2">
                                                        <div className="me-3 flex-shrink-0">
                                                            <Skeleton w={36} h={36} rounded />
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div className="mb-2"><Skeleton w="45%" h={14} /></div>
                                                            <div><Skeleton w="75%" h={12} /></div>
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
                                                className="btn btn-soft-primary btn-sm rounded-pill px-4"
                                                onClick={loadMore}
                                                disabled={actLoadingMore}
                                            >
                                                {actLoadingMore ? (
                                                    <><span className="spinner-border spinner-border-sm align-middle me-2"></span>Loading...</>
                                                ) : (
                                                    <><i className="ri-arrow-down-line align-middle me-1"></i> Load More Activity</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}
