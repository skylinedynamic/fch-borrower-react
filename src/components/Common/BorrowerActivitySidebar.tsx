import React, { useState, useEffect } from 'react'
import { getBorrowerActivityLogs } from '../../modules/activity-log/services'
import { FUNDING_REVIEW_STATUS_COLORS } from '../../config/funding'
import '../../components/Common/StatisticsCardSkeleton.css'

const Skeleton = ({ w, h, rounded = false }: { w: number | string; h: number; rounded?: boolean }) => (
    <div className={`skeleton-shimmer ${rounded ? 'rounded-circle' : 'rounded'}`} style={{ width: w, height: h }}></div>
)

export default function BorrowerActivitySidebar({ funding_application_id, pre_qualification_id }: { funding_application_id?: number | string, pre_qualification_id?: number | string }) {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (funding_application_id || pre_qualification_id) {
            fetchActivities()
        }
    }, [funding_application_id, pre_qualification_id])

    const fetchActivities = async () => {
        setLoading(true)
        try {
            const res = await getBorrowerActivityLogs({ funding_application_id, pre_qualification_id, page: 1, limit: 50 })
            setActivities(res.data || [])
        } catch (err) {
            console.error('Failed to fetch activity logs', err)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="card border-0 shadow-sm rounded-3 sticky-top activity-sidebar-sticky">
            <div className="card-header px-3 py-2 align-items-center justify-content-between d-flex flex-column flex-sm-row gap-2">
                <div className="d-flex align-items-center gap-2">
                    <i className="ri-history-line fs-18 text-dark"></i>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Activity</h5>
                </div>
            </div>
            <div className="card-body px-3 pt-3 pb-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <div className="timeline-container position-relative px-0">
                    {loading ? (
                        <div className="pt-2 pb-3">
                            {[1, 2, 3, 4, 5].map(i => (
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
                    ) : activities.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="ri-history-line fs-24 d-block mb-1 text-muted opacity-50"></i>
                            <p className="mb-0 fs-12 fw-semibold">No activities found.</p>
                        </div>
                    ) : (
                        <div className="timeline-list">
                            {activities.map((act) => (
                                <SidebarActivityItem key={act.id} act={act} formatDate={formatDate} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const getActivityIcon = (logTypeRaw: string, isSuccess = false) => {
    const logType = String(logTypeRaw || '').toLowerCase();
    if (logType === 'funding_request_create' || logType === 'funding_application_create') return { icon: 'ri-file-add-line', bg: 'bg-info-subtle', color: 'text-info' };
    if (logType === 'funding_request_status_update' || logType === 'funding_application_status_update' || logType === 'status_update') return { icon: 'ri-refresh-line', bg: 'bg-warning-subtle', color: 'text-warning' };
    if (logType.includes('create') || logType.includes('submit')) return { icon: 'ri-file-add-line', bg: 'bg-primary-subtle', color: 'text-primary' };
    if (logType.includes('approve') || logType.includes('accept') || isSuccess) return { icon: 'ri-checkbox-circle-line', bg: 'bg-success-subtle', color: 'text-success' };
    if (logType.includes('reject') || logType.includes('fail') || logType.includes('decline')) return { icon: 'ri-close-circle-line', bg: 'bg-danger-subtle', color: 'text-danger' };
    if (logType.includes('status')) return { icon: 'ri-refresh-line', bg: 'bg-warning-subtle', color: 'text-warning' };
    if (logType.includes('comment')) return { icon: 'ri-chat-3-line', bg: 'bg-warning-subtle', color: 'text-warning' };
    if (logType.includes('document') || logType.includes('upload')) return { icon: 'ri-folder-2-line', bg: 'bg-info-subtle', color: 'text-info' };
    if (logType.includes('invoice')) return { icon: 'ri-file-list-3-line', bg: 'bg-secondary-subtle', color: 'text-secondary' };
    if (logType.includes('email')) return { icon: 'ri-mail-send-line', bg: 'bg-primary-subtle', color: 'text-primary' };
    return { icon: 'ri-time-line', bg: 'bg-secondary-subtle', color: 'text-secondary' };
}

const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    const configKey = Object.keys(FUNDING_REVIEW_STATUS_COLORS).find(key => key.toLowerCase() === s || s.includes(key.toLowerCase()));
    if (configKey) return FUNDING_REVIEW_STATUS_COLORS[configKey];
    if (s === 'good' || s === 'strong') return '#10B981';
    if (s.includes('fail') || s.includes('miss')) return '#EF4444';
    return 'inherit';
};

const formatActivityTitle = (rawTitle: string, activity: any) => {
    if (typeof rawTitle !== 'string') return rawTitle;
    const oldStatus = activity.old_values?.status || activity.properties?.old?.status;
    const newStatus = activity.status || activity.properties?.status;

    if (rawTitle.includes('Status Changed:') || rawTitle.includes('Status Changed') || ((rawTitle === 'Funding Request Status Updated' || rawTitle === 'Funding Request Status Changed' || rawTitle === 'Funding Application Status Changed' || rawTitle === 'Funding Application Status Updated') && oldStatus && newStatus)) {
        let prefix = rawTitle.includes('Application') ? 'Funding Application Status Changed:' : 'Funding Request Status Changed:';
        let oldFormatted = oldStatus ? (oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)) : '';
        let newFormatted = newStatus ? (newStatus.charAt(0).toUpperCase() + newStatus.slice(1)) : '';

        if (rawTitle.includes('Status Changed:') || rawTitle.includes('Status Changed')) {
            const separator = rawTitle.includes('Status Changed:') ? 'Status Changed:' : 'Status Changed';
            const parts = rawTitle.split(separator);
            prefix = (parts[0] + separator).trim();
            const statusPart = parts.slice(1).join(separator).trim();

            const arrow = statusPart.includes('→') ? '→' : (statusPart.includes('->') ? '->' : (statusPart.includes('to') ? 'to' : null));
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
                    <span className="text-dark d-block">{prefix}</span>
                    <span className="d-inline-flex align-items-center flex-wrap gap-1 mt-1">
                        <span style={{ color: getStatusColor(oldFormatted) }}>{oldFormatted}</span>
                        <span className="text-muted px-1" style={{ fontSize: '11px' }}>→</span>
                        <span style={{ color: getStatusColor(newFormatted) }}>{newFormatted}</span>
                    </span>
                </span>
            );
        } else if (newFormatted) {
            return (
                <span className="d-block" style={{ lineHeight: '1.4' }}>
                    <span className="text-dark d-block">{prefix}</span>
                    <span style={{ color: getStatusColor(newFormatted) }} className="d-block mt-1">{newFormatted}</span>
                </span>
            );
        }
    }
    return rawTitle;
};

const SidebarActivityItem = ({ act, formatDate }: { act: any; formatDate: any }) => {
    const [expanded, setExpanded] = useState(false)
    const toggleExpand = () => setExpanded(!expanded)

    const rawTitle = act.event_label || act.log_type || 'Activity';
    const isApprove = String(rawTitle).toLowerCase().includes('approve') || String(rawTitle).toLowerCase().includes('accept');
    const { icon, bg, color } = getActivityIcon(act.log_type_raw || '', isApprove);

    return (
        <div className="d-flex timeline-item-row position-relative mb-3">
            <div className="timeline-dot-container me-3 position-relative" style={{ zIndex: 2, marginTop: '2px' }}>
                <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center ${bg} ${color} shadow-sm border border-white`} style={{ width: 36, height: 36 }}>
                    <i className={`${icon} fs-16`}></i>
                </div>
            </div>
            <div className="flex-grow-1 border-0 mb-0" style={{ minWidth: 0 }}>
                <div className="d-flex justify-content-between align-items-start p-1" style={{ cursor: 'pointer' }} onClick={toggleExpand}>
                    <div>
                        <h6 className="mb-0 text-dark fs-13" style={{ lineHeight: '1.4', fontWeight: 'normal' }}>{formatActivityTitle(rawTitle, act)}</h6>
                        <div className="fs-11 text-muted mt-1 fw-medium">
                            <i className="ri-time-line text-muted fs-11 me-1"></i>
                            {formatDate(act.created_at)}
                        </div>
                    </div>
                    <button
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
                
                <div className="fr-accordion-panel"
                    style={{
                        display: 'grid',
                        gridTemplateRows: expanded ? '1fr' : '0fr',
                        transition: 'grid-template-rows 200ms ease-in-out'
                    }}
                >
                    <div className="fr-accordion-panel-inner" style={{ overflow: 'hidden', paddingLeft: '2px' }}>
                        <div className="mt-2 p-1">
                            {act.description ? (
                                <div className="text-muted fs-12" dangerouslySetInnerHTML={{ __html: act.description }} />
                            ) : (
                                <p className="text-muted fs-12 mb-0">by {act.causer_name || 'System'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
