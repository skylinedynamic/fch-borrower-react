import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import Modal from 'bootstrap/js/dist/modal';
import { toast } from 'react-toastify';
import { Dropdown } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';

// API Services
import { fetchAppointmentById, createAppointment, deleteAppointment, updateAppointment, checkAvailability, fetchSelectableUsers } from '../../modules/appointment/services';
import { useAuthStore } from '../../store/auth/authStore';

import { useSummernote } from '../../hooks/useSummernote';
import { yearDropdownPlugin } from '../../utils/flatpickrPlugins';
import DeleteConfirmationModal from '../../components/GlobalModal/DeleteConfirmModal';

// Config
import { APPOINTMENT_TYPE_OPTIONS, TIMEZONE_OPTIONS, TIME_SLOTS } from '../../config/appointmentTypeOptions';

// Styles
import '../../../assets/css/appointment-modal.css';
import '../../../assets/css/appointment-styles.css';

// How many years past the current one the date picker's year list offers.
const APPOINTMENT_YEARS_AHEAD = 10;

interface AppointmentModalProps {
    onSuccess?: (data?: any) => void;
}

export interface AppointmentModalHandle {
    show: (id: string | number) => Promise<void>;
    create: (dateStr?: string) => void;
}

interface DisplayData {
    title: string;
    date: string;
    timeStart: string;
    timeEnd: string;
    location: string;
    description: string;
    scheduledBy: string;
    assignedFor: string;
    assignedForId: number | string | null;
    assignedForType: string | null;
    assignedForAvatar: string | null;
    appointmentCode: string;
    category: string;
    scheduledById: string | number | null;
}

const AppointmentModal = forwardRef<AppointmentModalHandle, AppointmentModalProps>(({ onSuccess }, ref) => {
    const eventModalRef = useRef(null);
    const dateInputRef = useRef(null);
    const descriptionEditorRef = useRef(null); // This ref will be passed to the useSummernote hook
    const [modalInstance, setModalInstance] = useState<any>(null);
    const [viewMode, setViewMode] = useState(true);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isNewEvent, setIsNewEvent] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const currentUser = useAuthStore((state) => state.user);

    const isHost = currentUser?.is_host == 1;

    const [assignedForType, setAssignedForType] = useState<string>('');
    const [selectableUsers, setSelectableUsers] = useState<any[]>([]);
    const [loadingAssignedFor, setLoadingAssignedFor] = useState(false);
    const [isMeetingWithChecked, setIsMeetingWithChecked] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        subject: '',
        category: 'Business Review',
        location: 'UTC (GMT+00:00)',
        description: '',
        date: '',
        timeStart: '09:00',
        timeEnd: '09:30',
        entity_id: '',
        assigned_for: '',
        entity_type: 'borrower',
    });

    // Display Data
    const [displayData, setDisplayData] = useState<DisplayData>({
        title: '',
        date: '',
        timeStart: '',
        timeEnd: '',
        location: '',
        description: '',
        scheduledBy: '',
        assignedFor: '',
        assignedForId: null,
        assignedForType: null,
        assignedForAvatar: null,
        appointmentCode: '',
        category: '',
        scheduledById: null,
    });

    const [originalData, setOriginalData] = useState<any>(null);

    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [showDateSkeleton, setShowDateSkeleton] = useState(false);
    const [availabilityConflicts, setAvailabilityConflicts] = useState<any>(null);
    const [lastConflictingAttempt, setLastConflictingAttempt] = useState<any>(null);
    const [conflictError, setConflictError] = useState<string | null>(null);
    const [isConflictVisible, setIsConflictVisible] = useState(false);
    const conflictTimeoutRef = useRef(null);
    const isSystemShiftRef = useRef(false);
    const prevDateRef = useRef(formData.date);
    const prevTimeStartRef = useRef(formData.timeStart);
    const prevTimeEndRef = useRef(formData.timeEnd);

    // Initialize Modal
    useEffect(() => {
        if (eventModalRef.current && !modalInstance) {
            const mod = new Modal(eventModalRef.current, {
                keyboard: false,
                focus: false // Prevents Bootstrap from stealing focus from Summernote dialogs
            });
            setModalInstance(mod);
        }
    }, []);

    // Check Availability
    useEffect(() => {
        const check = async () => {
            if (!formData.date || !formData.entity_id || viewMode) {
                setAvailabilityConflicts(null);
                setConflictError(null);
                return;
            }

            try {
                // User Request: Only show skeleton when time slot changes
                const timeChanged = prevTimeStartRef.current !== formData.timeStart ||
                    prevTimeEndRef.current !== formData.timeEnd;
                const isFirstCheck = !prevDateRef.current;

                if (timeChanged && !isFirstCheck) {
                    setIsCheckingAvailability(true);
                }

                setAvailabilityConflicts(null);
                const response: any = await checkAvailability({
                    assigned_for: formData.entity_id,
                    entity_type: formData.entity_type,
                    appointment_date: `${formData.date} ${formData.timeStart}:00`,
                    id: isNewEvent ? undefined : (selectedEventId as any)
                } as any);

                if (response.data && response.data.available === false) {
                    setAvailabilityConflicts(response.data);

                    const allConflicts = [
                        ...(response.data.assignee_conflicts || []),
                        ...(response.data.scheduler_conflicts || [])
                    ];

                    const matchingConflict = allConflicts.find(c => {
                        const cStart = c.start_time || "";
                        const cEnd = c.end_time || "";
                        // Standard overlap check: (StartA < EndB) && (EndA > StartB)
                        // AND exclude the CURRENT appointment itself by ID
                        const isSelf = !isNewEvent && String(c.id) === String(selectedEventId);
                        return (formData.timeStart < cEnd && formData.timeEnd > cStart) && !isSelf;
                    });

                    // Logic: If we are EDITING and the user has NOT changed the time/date, ignore conflicts (it's likely the current appointment)
                    const hasChanged = isNewEvent ||
                        formData.date !== originalData?.date ||
                        formData.timeStart !== originalData?.timeStart ||
                        formData.timeEnd !== originalData?.timeEnd;

                    if (matchingConflict) {
                        setLastConflictingAttempt({
                            attemptedStart: formData.timeStart,
                            attemptedEnd: formData.timeEnd,
                            conflict: matchingConflict
                        });
                        setIsConflictVisible(true);
                    } else {
                        setIsConflictVisible(false);
                        setLastConflictingAttempt(null);
                    }
                } else {
                    setAvailabilityConflicts(null);
                    setLastConflictingAttempt(null);
                    setIsConflictVisible(false);
                }
            } catch (error: any) {
                console.error("Availability check failed", error);
                // Optional: show toast if needed
            } finally {
                setIsCheckingAvailability(false);
                isSystemShiftRef.current = false;
                // Update refs after check
                prevDateRef.current = formData.date;
                prevTimeStartRef.current = formData.timeStart;
                prevTimeEndRef.current = formData.timeEnd;
            }
        };

        const timeoutId = setTimeout(() => {
            if (!viewMode) check();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.date, formData.timeStart, formData.timeEnd, formData.entity_id, formData.entity_type, viewMode, originalData]);

    // Helper functions (tConvert, formatDate, etc.) should be here or imported
    const tConvert = (timeStr: string): string => {
        if (!timeStr) return '';
        const [hStr, m] = timeStr.split(':');
        let h = Number(hStr);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };

    const formatDate = (dateObj: Date | string): string => {
        const d = new Date(dateObj);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${d.getDate() < 10 ? '0' + d.getDate() : d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    };

    const getShortType = (fullType: string | null | undefined): string => {
        if (!fullType) return 'partners';
        const segments = fullType.split('\\\\');
        const last = segments[segments.length - 1].toLowerCase();
        if (last === 'employee') return 'employee-details';
        if (last === 'partner') return 'partners';
        if (last === 'borrower') return 'clients';
        return last + 's';
    };

    const isSlotBlocked = (timeValue: string, isEnd = false): boolean => {
        if (!availabilityConflicts) return false;
        const allConflicts = [
            ...(availabilityConflicts.assignee_conflicts || []),
            ...(availabilityConflicts.scheduler_conflicts || [])
        ];
        return allConflicts.some(c => {
            const cStart = (c.start_time || "").substring(0, 5);
            const cEnd = (c.end_time || "").substring(0, 5);
            if (isEnd) {
                // Block if this end time is inside a conflict
                if (timeValue > cStart && timeValue <= cEnd) return true;
                // Block if this end time "jumps over" the conflict 
                // (i.e. starts after the conflict but our selected start is before it)
                if (formData.timeStart < cStart && timeValue > cStart) return true;
                return false;
            } else {
                // Start time cannot be inside a conflict
                return timeValue >= cStart && timeValue < cEnd;
            }
        });
    };

    // Load Options
    const loadSelectableUsers = async () => {
        try {
            setLoadingAssignedFor(true);
            const payload = {
                [isHost ? 'meeting_with' : 'meeting_with_host']: isMeetingWithChecked ? 1 : 0
            };
            const response = await fetchSelectableUsers(payload);
            if (response.status) {
                setSelectableUsers(response.data || []);
            }
        } catch (error) {
            console.error("Failed to load selectable users", error);
        } finally {
            setLoadingAssignedFor(false);
        }
    };

    useEffect(() => {
        if (!viewMode) {
            loadSelectableUsers();
        }
    }, [viewMode, isMeetingWithChecked]);

    // Exposure
    useImperativeHandle(ref, () => ({
        show: async (id: string | number) => {
            setIsNewEvent(false);
            setViewMode(true);
            setIsDescriptionExpanded(false);
            setSelectedEventId(id);
            setFormErrors({});
            setAvailabilityConflicts(null);
            if (modalInstance) modalInstance.show();
            await fetchDetails(id);
        },
        create: (dateStr?: string) => {
            setIsNewEvent(true);
            setViewMode(false);
            setSelectedEventId(null);
            setAssignedForType('borrower');
            setAvailabilityConflicts(null);
            setIsConflictVisible(false);
            setLastConflictingAttempt(null);
            setConflictError(null);
            setIsMeetingWithChecked(false);
            const defaultDate = dateStr || new Date().toISOString().split('T')[0];
            setFormData({
                subject: '',
                category: 'Business Review',
                location: 'UTC (GMT+00:00)',
                description: '',
                date: defaultDate,
                timeStart: '09:00',
                timeEnd: '09:30',
                entity_id: '',
                assigned_for: '',
                entity_type: 'borrower',
            });
            setFormErrors({});

            // Sync flatpickr if already initialized
            const dateInput = document.getElementById("event-start-date-modal");
            if (dateInput && (dateInput as any)._flatpickr) {
                (dateInput as any)._flatpickr.setDate(defaultDate);
            }

            if (modalInstance) modalInstance.show();
        }
    }));

    const fetchDetails = async (id: string | number) => {
        try {
            setLoadingDetails(true);
            const apt = await fetchAppointmentById(id);
            const dateStr = apt.appointment_date ? apt.appointment_date.replace(' ', 'T') : '';
            const start = dateStr ? new Date(dateStr) : new Date();
            const duration = apt.duration_minutes || 30;
            const end = new Date(start.getTime() + duration * 60000);

            setDisplayData({
                title: apt.subject,
                date: formatDate(start),
                timeStart: tConvert(start.toTimeString().slice(0, 5)),
                timeEnd: tConvert(end.toTimeString().slice(0, 5)),
                location: apt.timezone || "Virtual",
                description: apt.description || "No Description",
                scheduledBy: apt.scheduled_by?.name || "FCH Admin",
                assignedFor: apt.assigned_for?.name || "N/A",
                assignedForId: apt.assigned_for?.entity_id || apt.assigned_for?.id,
                assignedForType: apt.assigned_for?.entity_type || null,
                assignedForAvatar: apt.assigned_for?.image || apt.assigned_for?.avatar || apt.assigned_for?.profile_picture || null,
                appointmentCode: apt.appointment_code || '',
                category: apt.meeting_type || 'Business Review',
                scheduledById: apt.scheduled_by?.id || null,
            });

            const h_full = start.getHours().toString().padStart(2, '0');
            const m_full = start.getMinutes().toString().padStart(2, '0');
            const hh_mm_full = `${h_full}:${m_full}`;

            const h_end_full = end.getHours().toString().padStart(2, '0');
            const m_end_full = end.getMinutes().toString().padStart(2, '0');
            const hh_mm_end_full = `${h_end_full}:${m_end_full}`;

            // Set Form Data for Editing
            setFormData({
                subject: apt.subject,
                category: apt.meeting_type || 'Business Review',
                location: apt.timezone || "UTC (GMT+00:00)",
                description: apt.description || "",
                date: start.toISOString().split('T')[0],
                timeStart: hh_mm_full,
                timeEnd: hh_mm_end_full,
                entity_id: String(apt.assigned_for?.entity_id || apt.assigned_for?.id || ''),
                assigned_for: String(apt.assigned_for?.id || ''),
                entity_type: apt.assigned_for?.entity_type ? apt.assigned_for.entity_type.toLowerCase() : 'borrower'
            });

            setIsMeetingWithChecked(apt.meeting_with === 1 || apt.meeting_with_host === 1);

            if (apt.assigned_for) {
                const rawType = apt.assigned_for.entity_type;
                const formattedType = rawType ? rawType.toLowerCase() : '';
                setAssignedForType(formattedType);
                setFormData(p => ({
                    ...p,
                    entity_id: String(apt.assigned_for.entity_id || apt.assigned_for.id),
                    assigned_for: String(apt.assigned_for.id),
                    entity_type: formattedType
                }));

                // Set Original Data for Comparison
                setOriginalData({
                    subject: apt.subject,
                    category: apt.meeting_type || 'Business Review',
                    location: apt.timezone || "UTC (GMT+00:00)",
                    description: apt.description || "",
                    date: start.toISOString().split('T')[0],
                    timeStart: hh_mm_full,
                    timeEnd: hh_mm_end_full,
                    entity_id: String(apt.assigned_for.entity_id || apt.assigned_for.id),
                    assigned_for: String(apt.assigned_for.id),
                    entity_type: formattedType
                });
            }
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCancel = () => {
        setFormErrors({});
        setConflictError(null);
        if (isNewEvent || viewMode) {
            if (modalInstance) modalInstance.hide();
        } else {
            setViewMode(true);
        }
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        setFormErrors({});

        const toMySQLDate = (date: Date): string => {
            const pad = (num: number): string | number => (num < 10 ? '0' + num : num);
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        // Fetch description
        const descVal = formData.description;

        const startDateTime = new Date(`${formData.date}T${formData.timeStart}`);
        const endDateTime = new Date(`${formData.date}T${formData.timeEnd}`);
        const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000;

        if (!formData.date) {
            setFormErrors({ appointment_date: "Event date is required" });
            return;
        }

        // Check for conflicts before submission
        if (availabilityConflicts && availabilityConflicts.available === false) {
            const allConflicts = [
                ...(availabilityConflicts.assignee_conflicts || []),
                ...(availabilityConflicts.scheduler_conflicts || [])
            ];
            const matchingConflict = allConflicts.find(c => {
                const cStart = c.start_time || "";
                const cEnd = c.end_time || "";
                const isOverlap = (formData.timeStart < cEnd && formData.timeEnd > cStart);
                const isSelf = !isNewEvent && String(c.id) === String(selectedEventId);
                return isOverlap && !isSelf;
            });

            if (matchingConflict) {
                toast.error('Cannot save appointment: Time slot conflicts with another appointment');
                setIsConflictVisible(true);
                return;
            }
        }

        // FIXED PAYLOAD as requested
        const payload: any = {
            subject: formData.subject,
            description: descVal,
            appointment_date: toMySQLDate(startDateTime),
            timezone: formData.location,
            duration_minutes: durationMinutes,
            meeting_type: formData.category,
            entity_type: assignedForType || null,
            entity_id: assignedForType ? (formData.entity_id ? parseInt(formData.entity_id) : null) : null,
            assigned_for: formData.assigned_for ? parseInt(formData.assigned_for) : null,
            [isHost ? 'meeting_with' : 'meeting_with_host']: isMeetingWithChecked ? 1 : 0
        };

        try {
            setIsSubmitting(true);
            let response: any;
            if (selectedEventId && !isNewEvent) {
                response = await updateAppointment(selectedEventId as any, payload);
            } else {
                response = await createAppointment(payload);
            }

            if (response && response.status) {
                toast.success(response.message || `Appointment ${isNewEvent ? 'created' : 'updated'} successfully`);
                if (modalInstance) modalInstance.hide();
                if (onSuccess) onSuccess();
            } else {
                toast.error(response?.message || `Failed to ${isNewEvent ? 'create' : 'update'} appointment`);
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || 'Failed to save appointment');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = () => {
        if (!selectedEventId) return;
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!selectedEventId) return;
        try {
            setIsDeleting(true);
            const response = await deleteAppointment(selectedEventId);
            if (response && response.status) {
                toast.success(response.message || "Appointment deleted successfully");
                setShowDeleteConfirm(false);
                if (modalInstance) modalInstance.hide();
                if (onSuccess) onSuccess();
            } else {
                toast.error(response?.message || "Failed to delete appointment");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete appointment");
        } finally {
            setIsDeleting(false);
        }
    };

    // Flatpickr initialization
    useEffect(() => {
        if (dateInputRef.current && !viewMode) {
            const thisYear = new Date().getFullYear();
            const fp = flatpickr(dateInputRef.current, {
                mode: "single",
                minDate: "today",
                defaultDate: formData.date,
                disableMobile: true, // Forces custom UI on mobile
                // Same month/year dropdowns as every other date picker. Bookings
                // only look forward, so the year list runs ahead, not back.
                monthSelectorType: "dropdown",
                plugins: [yearDropdownPlugin(thisYear, thisYear + APPOINTMENT_YEARS_AHEAD)],
                onChange: (selectedDates, dateStr) => {
                    setFormData(prev => ({ ...prev, date: dateStr }));
                }
            });
            return () => fp.destroy();
        }
    }, [viewMode]);


    // Use global Summernote hook
    const { editorRef: descriptionRef } = useSummernote('description', formData.description, (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            description: value
        }));
    }, {
        height: 150,
        placeholder: 'Enter description here...',
        dialogsInBody: true
    }, !viewMode); // Pass !viewMode as the enabled state

    const assignedOptions = selectableUsers.map(u => ({
        label: u.name,
        value: String(u.entity_id || u.id),
        user_id: String(u.id),
        entity_type: u.entity_type,
        actual_entity_id: String(u.entity_id || '')
    }));

    return (
        <div className="modal fade borrower-appointments-wrapper" id="appointmentModal" ref={eventModalRef} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header p-3 px-4" style={{ backgroundColor: '#f3f6f9', borderBottom: '1px solid #e9ebec' }}>
                        <h5 className="modal-title fw-bold text-dark" id="event-modal-title" style={{ fontSize: '18px' }}>
                            {viewMode ? "Appointment Details" : (isNewEvent ? "Add Appointment" : "Edit Appointment")}
                        </h5>
                        <button type="button" className="btn-close shadow-none" onClick={handleCancel} aria-label="Close"></button>
                    </div>

                    <div className="modal-body p-4" style={{ backgroundColor: '#fdfdfd' }}>
                        {/* Details View */}
                        {viewMode ? (
                            loadingDetails ? (
                                <div className="event-details-skeleton">
                                    <div className="mb-4">
                                        <Skeleton width="120px" height="12px" className="mb-2" />
                                        <Skeleton width="60%" height="28px" borderRadius="4px" />
                                    </div>
                                    <div className="mb-4">
                                        <Skeleton width="100px" height="12px" className="mb-2" />
                                        <div className="p-4 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ebec' }}>
                                            <Skeleton width="100%" height="14px" className="mb-2" />
                                            <Skeleton width="90%" height="14px" className="mb-2" />
                                            <Skeleton width="40%" height="14px" />
                                        </div>
                                    </div>
                                    <div className="row g-4 mb-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div className="col-md-6" key={i}>
                                                <div className="d-flex align-items-center">
                                                    <Skeleton shape="circle" size="32px" className="me-3" />
                                                    <div className="flex-grow-1">
                                                        <Skeleton width="60px" height="10px" className="mb-2" />
                                                        <Skeleton width="120px" height="16px" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 rounded-3 d-flex align-items-center" style={{ backgroundColor: '#f3f6f9', border: '1px solid #e9ebec' }}>
                                        <Skeleton shape="circle" size="64px" className="me-3" />
                                        <div className="flex-grow-1">
                                            <Skeleton width="100px" height="12px" className="mb-2" />
                                            <Skeleton width="180px" height="20px" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-top d-flex justify-content-end">
                                        <Skeleton width="100px" height="40px" borderRadius="4px" />
                                    </div>
                                </div>
                            ) : (
                                <div className="event-details position-relative">
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <div className="flex-grow-1">
                                                <label className="uppercase-label mb-1 d-block">APPOINTMENT TITLE</label>
                                                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px', letterSpacing: '-0.3px', lineHeight: '1.4' }}>{displayData.title || "No Title"}</h4>
                                            </div>

                                            {(currentUser?.id == displayData.scheduledById) && (
                                                <div className="flex-shrink-0">
                                                    <button
                                                        className="btn btn-sm btn-soft-primary d-flex align-items-center px-3 fw-bold shadow-none"
                                                        onClick={() => setViewMode(false)}
                                                        style={{ height: '34px' }}
                                                    >
                                                        <i className="ri-pencil-fill fs-14 me-1"></i> Edit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="uppercase-label mb-2 d-block">DESCRIPTION</label>
                                        <div className="description-wrapper">
                                            {(() => {
                                                const description = displayData.description || "No Description";
                                                const cleanHtml = (html: string) => {
                                                    if (!html) return "";
                                                    return html
                                                        .replace(/width:\s*[^;"]+;?/gi, '')
                                                        .replace(/float:\s*[^;"]+;?/gi, '')
                                                        .replace(/background-color:\s*[^;"]+;?/gi, 'background-color: transparent;')
                                                        .replace(/background:\s*[^;"]+;?/gi, 'background: transparent;');
                                                };

                                                const rawText = description
                                                    .replace(/<[^>]*>/g, '')
                                                    .replace(/&nbsp;/g, ' ')
                                                    .replace(/\s+/g, ' ')
                                                    .trim();

                                                const limit = 180;

                                                return (
                                                    <div className="text-dark fs-14" style={{ lineHeight: "1.8", letterSpacing: "0.2px" }}>
                                                        {!isDescriptionExpanded && rawText.length > limit ? (
                                                            <>
                                                                {rawText.substring(0, limit)}...
                                                                <button
                                                                    type="button"
                                                                    className="see-more-less-btn ms-2"
                                                                    onClick={() => setIsDescriptionExpanded(true)}
                                                                >
                                                                    SEE MORE <i className="ri-arrow-down-s-line align-middle ms-1"></i>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div
                                                                    className="rich-text-content"
                                                                    dangerouslySetInnerHTML={{ __html: cleanHtml(description) }}
                                                                />
                                                                {isDescriptionExpanded && rawText.length > limit && (
                                                                    <button
                                                                        type="button"
                                                                        className="see-more-less-btn d-block mt-2"
                                                                        onClick={() => setIsDescriptionExpanded(false)}
                                                                    >
                                                                        SEE LESS <i className="ri-arrow-up-s-line align-middle ms-1"></i>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <DetailItem icon="ri-calendar-event-line" label="DATE" value={displayData.date} />
                                        <DetailItem icon="ri-time-line" label="TIME SLOT" value={`${displayData.timeStart} - ${displayData.timeEnd}`} />
                                        <DetailItem icon="ri-map-pin-line" label="TIME ZONE" value={displayData.location} />
                                        <DetailItem icon="ri-user-star-line" label="SCHEDULED BY" value={displayData.scheduledBy} />
                                    </div>

                                    <div className="appointment-with-box-full shadow-none mt-3">
                                        <div className="flex-shrink-0 me-4">
                                            <div className="avatar-circle-custom">
                                                {displayData.assignedForAvatar ? (
                                                    <img src={displayData.assignedForAvatar} alt="" />
                                                ) : (
                                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white" style={{ fontSize: '24px' }}>
                                                        <i className="ri-user-line"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <p className="uppercase-label mb-0" style={{ color: '#4b5563' }}>
                                                APPOINTMENT WITH:
                                            </p>

                                            <h5 className="mb-0 fs-16 fw-bold" style={{ color: '#3b4b7a' }}>
                                                {displayData.assignedFor || "Unassigned"}
                                            </h5>
                                        </div>
                                    </div>

                                    {(currentUser?.id == displayData.scheduledById) && (
                                        <div className="mt-4 pt-4 border-top d-flex justify-content-end">
                                            <button className="btn btn-soft-danger fw-bold text-uppercase fs-12 px-4 shadow-none" onClick={confirmDelete} disabled={isDeleting} style={{ height: '40px' }}>
                                                <i className="ri-delete-bin-line me-1 align-middle"></i> {isDeleting ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            /* Form View */
                            <form onSubmit={handleSubmit}>

                                <div className="row">

                                    <div className="col-12 mb-3">
                                        <label className="form-label">Appointment Title <span className="text-danger">*</span></label>
                                        <input type="text" className={`form-control ${formErrors.subject ? "is-invalid" : ""}`}
                                            value={formData.subject} onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="Enter appointment title" />
                                        {formErrors.subject && <div className="invalid-feedback">{formErrors.subject}</div>}
                                    </div>

                                    <div className="col-12 mb-3">
                                        <label className="form-label">Type <span className="text-danger">*</span></label>
                                        <Dropdown value={formData.category} options={APPOINTMENT_TYPE_OPTIONS}
                                            onChange={(e) => setFormData(p => ({ ...p, category: e.value }))}
                                            className={`w-100 ${formErrors.meeting_type ? 'p-invalid' : ''}`}
                                            placeholder="Select Type" appendTo="self" />
                                        {formErrors.meeting_type && <div className="text-danger fs-11 mt-1">{formErrors.meeting_type}</div>}
                                    </div>

                                    <div className="col-12 mb-3">
                                        <div className="d-flex align-items-center justify-content-between mb-2 mt-1">
                                            <label className="form-label mb-0">
                                                {isHost ? "Appointment With" : "Appointment With"} <span className="text-danger">*</span>
                                            </label>
                                            {/* <div className="form-check"> */}
                                            {/* <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="meeting-with-toggle"
                                                    checked={isMeetingWithChecked}
                                                    onChange={(e) => setIsMeetingWithChecked(e.target.checked)}
                                                    name={isHost ? "meeting_with" : "meeting_with_host"}
                                                    value="1"
                                                /> */}
                                            {/* <label className="form-check-label ms-1" htmlFor="meeting-with-toggle">
                                                    {isHost ? "Meeting with partner" : "Meeting with host"}
                                                </label> */}
                                            {/* </div> */}
                                        </div>

                                        <div className="position-relative" style={{ minHeight: '38px' }}>
                                            {loadingAssignedFor ? (
                                                <Skeleton width="100%" height="38px" className="rounded-2" />
                                            ) : (
                                                <Dropdown value={formData.entity_id} options={assignedOptions}
                                                    onChange={(e) => {
                                                        const selected = assignedOptions.find(opt => opt.value === e.value);
                                                        const newType = selected?.entity_type?.toLowerCase() || '';
                                                        setAssignedForType(newType);
                                                        setFormData(p => ({
                                                            ...p,
                                                            entity_id: e.value,
                                                            assigned_for: selected?.user_id || e.value,
                                                            entity_type: newType
                                                        }));
                                                    }}
                                                    placeholder="Select Partner"
                                                    className={`w-100 ${formErrors.assigned_for ? 'p-invalid' : ''}`}
                                                    appendTo="self" />
                                            )}
                                            {formErrors.assigned_for && <div className="text-danger fs-11 mt-1">{formErrors.assigned_for}</div>}
                                        </div>
                                    </div>

                                    <div className="col-12 position-relative px-0 mb-2" style={{ minHeight: '38px' }}>
                                        <div className="row mx-0">
                                            <div className="col-12 mb-3 px-2">
                                                <label className="form-label fs-13 fw-semibold">Event Date <span className="text-danger">*</span></label>
                                                <div className="input-group">
                                                    <input type="text" ref={dateInputRef} id="event-start-date-modal"
                                                        className={`form-control ${formErrors.appointment_date ? 'is-invalid' : ''}`}
                                                        value={formData.date} readOnly placeholder="Select date" />
                                                    <span className="input-group-text bg-light"><i className="ri-calendar-event-line text-muted"></i></span>
                                                    {formErrors.appointment_date && <div className="invalid-feedback d-block mt-1" style={{ position: 'absolute', bottom: '-22px', left: '0', fontSize: '10px' }}>{formErrors.appointment_date}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12 mb-3 px-2">


                                                <label className="form-label fs-13 fw-semibold">Time Slot <span className="text-danger">*</span></label>
                                                <div className="d-flex align-items-center gap-2 time-slot-container">
                                                    <Dropdown value={formData.timeStart} options={TIME_SLOTS}
                                                        onChange={(e) => {
                                                            const startVal = e.value;
                                                            setFormData(p => {
                                                                const newData = { ...p, timeStart: startVal };
                                                                // Automatically select the next 30-minute slot for timeEnd
                                                                const [h, m] = startVal.split(':').map(Number);
                                                                let endM = m + 30;
                                                                let endH = h;
                                                                if (endM >= 60) {
                                                                    endH += 1;
                                                                    endM = 0;
                                                                }
                                                                if (endH < 24) {
                                                                    newData.timeEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                                                                } else {
                                                                    // Fallback if it's the last slot of the day
                                                                    newData.timeEnd = startVal;
                                                                }
                                                                return newData;
                                                            });
                                                        }}
                                                        className={`flex-grow-1 ${formErrors.timeStart ? 'p-invalid' : ''}`} placeholder="Start" appendTo="self" />
                                                    <span className="text-muted fw-bold">to</span>
                                                    <Dropdown value={formData.timeEnd}
                                                        options={TIME_SLOTS.filter(slot => slot.value > formData.timeStart)}
                                                        onChange={(e) => {
                                                            setFormData(p => ({ ...p, timeEnd: e.value }));
                                                        }}
                                                        className={`flex-grow-1 ${formErrors.timeEnd ? 'p-invalid' : ''}`} placeholder="End" appendTo="self" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Availability Alert - Animated Collapse */}
                                    <div className="col-12 px-2 overflow-hidden"
                                        style={{ transition: 'all 0.4s ease', maxHeight: isConflictVisible && (availabilityConflicts || lastConflictingAttempt) ? '200px' : '0', opacity: isConflictVisible ? 1 : 0, marginBottom: isConflictVisible && (availabilityConflicts || lastConflictingAttempt) ? '1rem' : '0' }}>
                                        {(availabilityConflicts || lastConflictingAttempt) && (
                                            <div className="alert alert-danger-subtle border border-danger-subtle d-flex align-items-center mb-0 py-2 position-relative" role="alert">
                                                <i className="ri-error-warning-fill me-2 fs-18 text-danger"></i>
                                                <div className="flex-grow-1 pe-4">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <strong className="text-danger fs-13 text-uppercase">Scheduling Conflict</strong>
                                                        <span className="badge bg-danger text-white fs-10 px-2 py-1">CONFLICTED</span>
                                                    </div>
                                                    <span className="fs-12 text-muted d-block mt-1">
                                                        {(() => {
                                                            const attempt = lastConflictingAttempt;
                                                            if (attempt) {
                                                                const { attemptedStart, attemptedEnd, conflict } = attempt;
                                                                return (
                                                                    <>
                                                                        Your selected <span className="fw-bold">{tConvert(attemptedStart)} - {tConvert(attemptedEnd)}</span> conflicts with an existing appointment on <span className="fw-bold">{conflict.date}</span> from <span className="fw-bold">{tConvert(conflict.start_time)} to {tConvert(conflict.end_time)}</span>.
                                                                    </>
                                                                );
                                                            }
                                                            return "Conflicting appointment found on this date.";
                                                        })()}
                                                    </span>
                                                </div>
                                                <button type="button" className="btn-close fs-10 position-absolute"
                                                    style={{ right: '8px', top: '8px' }}
                                                    onClick={() => setIsConflictVisible(false)} aria-label="Close"></button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skeleton Loader for Availability Check */}
                                    {isCheckingAvailability && (
                                        <div className="col-12 px-2 mt-2">
                                            <Skeleton width="100%" height="40px" className="rounded-2" />
                                        </div>
                                    )}

                                    <div className="col-12 mb-3">
                                        <label className="form-label fs-13 fw-semibold">Time Zone</label>
                                        <Dropdown value={formData.location} options={TIMEZONE_OPTIONS}
                                            onChange={(e) => setFormData(p => ({ ...p, location: e.value }))}
                                            className={`w-100 ${formErrors.timezone ? 'p-invalid' : ''}`} placeholder="Select Time Zone" appendTo="self" />
                                        {formErrors.timezone && <div className="text-danger fs-11 mt-1">{formErrors.timezone}</div>}
                                    </div>

                                    <div className="col-12 mb-3">
                                        <label className="form-label fs-13 fw-semibold">Description</label>
                                        <div ref={descriptionRef as React.RefObject<HTMLDivElement>}></div>
                                    </div>
                                </div>

                                <div className="hstack gap-2 justify-content-end mt-4 pt-3 border-top">
                                    <button type="button" className="btn btn-light" onClick={handleCancel}>Cancel</button>
                                    <button type="submit" className="btn btn-primary"
                                        disabled={isSubmitting || isCheckingAvailability || isConflictVisible}>
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <i className={`${isNewEvent ? 'ri-add-line' : 'ri-save-line'} me-1 align-middle`}></i>
                                                {isNewEvent ? "Confirm Appointment" : "Save Changes"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                show={showDeleteConfirm}
                onConfirm={handleDelete}
                onClose={() => setShowDeleteConfirm(false)}
                loading={isDeleting}
                text="Are you sure you want to delete this appointment? This action cannot be undone."
            />
        </div >
    );
});

const DetailItem = ({ icon, label, value, className = '' }: { icon: string, label: string, value: string | number | null | undefined, className?: string }) => (
    <div className={`col-md-6 ${className}`}>
        <div className="d-flex align-items-center mb-3">
            <div className="flex-shrink-0 me-3">
                <div className="detail-item-icon">
                    <i className={`${icon} fs-18`}></i>
                </div>
            </div>
            <div className="flex-grow-1">
                <p className="uppercase-label mb-1">{label}</p>
                <h6 className="mb-0 fs-14 fw-bold text-dark" style={{ letterSpacing: '-0.1px' }}>{value || "N/A"}</h6>
            </div>
        </div>
    </div>
);

export default AppointmentModal;
