import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import Modal from 'bootstrap/js/dist/modal';
import { toast } from 'react-toastify';
import { Dropdown } from 'primereact/dropdown';
import { Skeleton } from 'primereact/skeleton';

// API Services
import { fetchAppointmentById, createAppointment, deleteAppointment, updateAppointment, checkAvailability, fetchSelectableUsers, cancelAppointment } from '../../modules/appointment/services';
import { canCancelAppointment } from '../../modules/appointment/cancel';
import ConfirmationModal from '../../components/GlobalModal/ConfirmationModal';
import { useAuthStore } from '../../store/auth/authStore';

import { useSummernote } from '../../hooks/useSummernote';
import { yearDropdownPlugin } from '../../utils/flatpickrPlugins';
import DeleteConfirmationModal from '../../components/GlobalModal/DeleteConfirmModal';

// Config
import { APPOINTMENT_TYPE_OPTIONS, TIME_SLOTS } from '../../config/appointmentTypeOptions';
import { browserTimeZone, defaultStart, endSlotsAfter, endWithinDay, localDateString, minutesBetween, startSlotsFrom, timeAfter, timeZoneLabel } from '../../utils/appointmentTime';

// Styles
import '../../../assets/css/appointment-modal.css';
import '../../../assets/css/appointment-styles.css';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { bookCalendlyAppointment, fetchCalendlyAvailableTimes, fetchCalendlyEventTypes } from '../../modules/calendly/services';
import type { CalendlyEventType, CalendlySlot, CalendlyStatus } from '../../modules/calendly/types';

// How many years past the current one the date picker's year list offers.
const APPOINTMENT_YEARS_AHEAD = 10;

// The API fields the form shows a refusal beside; any other shows under the time slot (R2 BUG-024).
const FORM_ERROR_FIELDS = ['subject', 'meeting_type', 'assigned_for', 'appointment_date', 'duration_minutes', 'timezone', 'location', 'location_kind'];

interface AppointmentModalProps {
    onSuccess?: (data?: any) => void;
    /** The borrower's partner's Calendly: connected, a new appointment may be booked with it. */
    calendlyStatus?: CalendlyStatus;
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
    // For "Cancel appointment" (R2 BUG-046).
    status: string | null;
    startsAt: Date | null;
    assignedForUserId: number | string | null;
}

const AppointmentModal = forwardRef<AppointmentModalHandle, AppointmentModalProps>(({ onSuccess, calendlyStatus }, ref) => {
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
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Under the time slot: the duration's refusal, else one on a field the form has no place for (R2 BUG-024).
    const unshownErrorField = Object.keys(formErrors).find(field => !FORM_ERROR_FIELDS.includes(field));
    const timeSlotError = formErrors.duration_minutes || (unshownErrorField ? ([] as string[]).concat(formErrors[unshownErrorField])[0] : null);

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
        // Booked in the browser's zone; the API stores UTC (BUG-080).
        location: browserTimeZone(),
        description: '',
        date: '',
        timeStart: '09:00',
        timeEnd: '09:30',
        entity_id: '',
        assigned_for: '',
        entity_type: 'borrower',
    });
    // A refused date/time is about the one picked then: a new date or time clears it.
    useEffect(() => {
        setFormErrors(p => {
            if (!p.appointment_date) return p;
            const { appointment_date: _refused, ...rest } = p;
            return rest;
        });
    }, [formData.date, formData.timeStart]);
    // "Appointment with is required": answered once someone is chosen.
    useEffect(() => {
        if (!formData.assigned_for) return;
        setFormErrors(p => {
            if (!p.assigned_for) return p;
            const { assigned_for: _answered, ...rest } = p;
            return rest;
        });
    }, [formData.assigned_for]);

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
        status: null,
        startsAt: null,
        assignedForUserId: null,
    });

    const [originalData, setOriginalData] = useState<any>(null);

    // Sync with Calendly - as in the partner portal: the date and time picked
    // here are booked in Calendly too, with the account's active event type
    // (picked by FCH, never asked). In their own Calendly once connected (they
    // invite who they pick), else in their partner's (they are the invitee).
    const canBookInCalendly = isNewEvent && Boolean(calendlyStatus?.can_book);
    const booksInOwnCalendly = Boolean(calendlyStatus?.is_host);
    const [bookInCalendly, setBookInCalendly] = useState(false);
    // The appointment being edited is a Calendly meeting: its new title or time changes it in Calendly too.
    const [editingCalendlyMeeting, setEditingCalendlyMeeting] = useState(false);
    const inCalendly = canBookInCalendly && bookInCalendly && !viewMode;
    // Calendly applies to this form: a new meeting booked there, or a Calendly meeting being
    // edited (its new title or time is changed there) - both get the live Calendly checks.
    const calendlySynced = inCalendly || (!isNewEvent && editingCalendlyMeeting && !viewMode);
    const [calendlyEventTypes, setCalendlyEventTypes] = useState<CalendlyEventType[]>([]);
    const [loadingEventTypes, setLoadingEventTypes] = useState(false);
    // Which of the event type's places (Zoom, phone call, in person, ...), and where -
    // when that place asks the invitee (a phone call to them uses their FCH number).
    const [calendlyLocationKind, setCalendlyLocationKind] = useState('');
    const [calendlyLocation, setCalendlyLocation] = useState('');
    // The Calendly account's active event type - it sets the meeting's length and place.
    const calendlyEventType = calendlyEventTypes[0];
    const calendlyMinutes = calendlyEventType?.duration || 30;
    const calendlyLocationOptions = calendlyEventType?.location_options || [];
    const calendlyLocationChoice = calendlyLocationOptions.find(option => option.kind === calendlyLocationKind) || calendlyLocationOptions[0];
    const calendlyLocationKindInUse = calendlyLocationChoice?.kind || calendlyEventType?.location_kind;
    const calendlyAsksInvitee = calendlyLocationChoice ? Boolean(calendlyLocationChoice.asks_invitee) : Boolean(calendlyEventType?.asks_invitee_location);
    // A phone call uses the number in FCH; it is asked for only when the API says there is none.
    const [askCalendlyPhone, setAskCalendlyPhone] = useState(false);
    const calendlyAsksLocation = calendlyAsksInvitee && (calendlyLocationKindInUse !== 'outbound_call' || askCalendlyPhone);
    const calendlyLocationLabel = calendlyLocationKindInUse === 'outbound_call' ? 'Phone number to call' : 'Where to meet';
    // A place belongs to its event type.
    useEffect(() => setCalendlyLocationKind(''), [calendlyEventType?.uri]);

    useEffect(() => {
        if (!calendlySynced) return;
        let active = true;
        setLoadingEventTypes(true);
        fetchCalendlyEventTypes()
            .then(types => { if (active) setCalendlyEventTypes(types); })
            .catch(() => { if (active) setCalendlyEventTypes([]); })
            .finally(() => { if (active) setLoadingEventTypes(false); });
        return () => { active = false; };
    }, [calendlySynced]);

    // Calendly sets the meeting's length (its event type's): the end follows the start.
    useEffect(() => {
        if (calendlySynced && formData.timeStart) {
            setFormData((p: any) => ({ ...p, timeEnd: timeAfter(p.timeStart, calendlyMinutes) }));
        }
    }, [calendlySynced, formData.timeStart, calendlyMinutes]);

    // Live overlap check: Calendly's open times that day (already without FCH
    // meetings) - the picked start must be one of them.
    // In their own Calendly, checked only once the person is chosen ("Appointment With"):
    // that person's FCH meetings count too. With the advisor's, they are the invitee themselves.
    const calendlyNeedsPerson = booksInOwnCalendly && !formData.assigned_for;
    const calendlyTimesPayload = calendlySynced && calendlyEventType && formData.date && !calendlyNeedsPerson
        ? {
            event_type_uri: calendlyEventType.uri,
            date: formData.date,
            timezone: formData.location,
            ...(booksInOwnCalendly && formData.assigned_for ? { assigned_for: Number(formData.assigned_for) } : {}),
            // Editing: the meeting's own time does not count as taken in FCH.
            ...(!isNewEvent && selectedEventId ? { except_appointment_id: Number(selectedEventId) } : {}),
        }
        : null;
    const calendlyTimesKey = calendlyTimesPayload ? JSON.stringify(calendlyTimesPayload) : '';
    const [calendlyOpenTimes, setCalendlyOpenTimes] = useState<CalendlySlot[]>([]);
    const [checkingCalendly, setCheckingCalendly] = useState(false);
    const [calendlyCheckError, setCalendlyCheckError] = useState('');
    const [calendlyChecked, setCalendlyChecked] = useState(false);
    useEffect(() => {
        setCalendlyOpenTimes([]);
        setCalendlyCheckError('');
        setCalendlyChecked(false);
        if (!calendlyTimesPayload) return;
        let active = true;
        setCheckingCalendly(true);
        fetchCalendlyAvailableTimes(calendlyTimesPayload as any)
            .then(slots => { if (active) { setCalendlyOpenTimes(slots); setCalendlyChecked(true); } })
            // Why Calendly could not be asked (e.g. the connection expired) - not "no open times".
            .catch((error: any) => { if (active) setCalendlyCheckError(error?.response?.data?.message || 'Calendly availability could not be checked'); })
            .finally(() => { if (active) setCheckingCalendly(false); });
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendlyTimesKey]);
    const calendlyPickedLocal = formData.date && formData.timeStart ? `${formData.date} ${formData.timeStart}:00` : '';
    // An edited meeting kept at its own time is not an overlap (Calendly lists it as taken - by itself).
    const keepsOwnTime = !isNewEvent && originalData?.date === formData.date && originalData?.timeStart === formData.timeStart;
    const calendlyOverlap = calendlySynced && calendlyChecked && !checkingCalendly && Boolean(calendlyPickedLocal) && !keepsOwnTime
        && !calendlyOpenTimes.some(slot => slot.local_time === calendlyPickedLocal);
    // Calendly's hours that day, to say *why* a time overlaps: inside them it is
    // already booked; outside them Calendly is closed.
    const calendlyHours = calendlyOpenTimes.length
        ? {
            from: calendlyOpenTimes[0].local_time.slice(11, 16),
            to: timeAfter(calendlyOpenTimes[calendlyOpenTimes.length - 1].local_time.slice(11, 16), calendlyMinutes),
        }
        : null;
    const calendlyOverlapBooked = Boolean(calendlyOverlap && calendlyHours && formData.timeStart
        && formData.timeStart >= calendlyHours.from && formData.timeStart < calendlyHours.to);
    // No open time that day: the next day (within a week) that has some.
    const [calendlyNextOpen, setCalendlyNextOpen] = useState<{ date: string; slots: CalendlySlot[] } | null>(null);
    const [findingNextOpen, setFindingNextOpen] = useState(false);
    // Still looking for the next open day (the day picked has none): nothing is shown
    // until the answer is complete - Confirm waits meanwhile.
    const searchingNextOpen = calendlyOpenTimes.length === 0 && findingNextOpen && !calendlyNextOpen;
    useEffect(() => {
        setCalendlyNextOpen(null);
        setFindingNextOpen(false);
        if (!calendlyChecked || calendlyOpenTimes.length > 0 || !calendlyTimesPayload) return;
        let active = true;
        setFindingNextOpen(true);
        (async () => {
            const [y, m, d] = formData.date.split('-').map(Number);
            for (let i = 1; i <= 7 && active; i++) {
                const next = new Date(y, m - 1, d + i);
                const date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
                try {
                    const slots = await fetchCalendlyAvailableTimes({ ...calendlyTimesPayload, date } as any);
                    if (active && slots.length) {
                        setCalendlyNextOpen({ date, slots });
                        setFindingNextOpen(false);
                        return;
                    }
                } catch {
                    break;
                }
            }
            if (active) setFindingNextOpen(false);
        })();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendlyChecked, calendlyOpenTimes.length, calendlyTimesKey]);
    // Picks an open Calendly time (on that day): start, and the end Calendly books.
    const pickCalendlyTime = (date: string, slot: CalendlySlot) => {
        const value = slot.local_time.slice(11, 16);
        setFormData((p: any) => ({ ...p, date, timeStart: value, timeEnd: timeAfter(value, calendlyMinutes) }));
    };
    // Someone else may have a number in FCH: ask again only if the API says so.
    useEffect(() => setAskCalendlyPhone(false), [formData.assigned_for]);

    // Start times still ahead on the chosen day (BUG-078); an appointment being
    // edited keeps its own time in the list.
    const openStarts = startSlotsFrom(TIME_SLOTS, formData.date);
    const ownStart: string | null = !isNewEvent && originalData?.date === formData.date ? originalData?.timeStart : null;
    const startOptions = ownStart && !openStarts.some(slot => slot.value === ownStart)
        ? TIME_SLOTS.filter(slot => slot.value === ownStart || openStarts.includes(slot))
        : openStarts;

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
            // Calendly's open times already leave out both people's FCH meetings.
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
                        return (formData.timeStart < cEnd && endWithinDay(formData.timeStart, formData.timeEnd) > cStart) && !isSelf;
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
    }, [formData.date, formData.timeStart, formData.timeEnd, formData.entity_id, formData.entity_type, viewMode, originalData, inCalendly]);

    // Helper functions (tConvert, formatDate, etc.) should be here or imported
    const tConvert = (timeStr: string): string => {
        if (!timeStr) return '';
        const [hStr, m] = timeStr.split(':');
        let h = Number(hStr);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };
    // A time's label as the time-slot dropdowns show it (e.g. "06:30 PM").
    const timeLabel = (value: string): string => TIME_SLOTS.find(slot => slot.value === value)?.label || tConvert(value);

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
            setBookInCalendly(false);
            setEditingCalendlyMeeting(false);
            setCalendlyLocation('');
            setAskCalendlyPhone(false);
            // The browser's own day, at 09:00 or the next time still ahead (BUG-078).
            const start = defaultStart(TIME_SLOTS, dateStr || localDateString());
            const defaultDate = start.date;
            setFormData({
                subject: '',
                category: 'Business Review',
                location: browserTimeZone(),
                description: '',
                date: defaultDate,
                timeStart: start.time,
                timeEnd: timeAfter(start.time),
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
            setEditingCalendlyMeeting(Boolean((apt as any).is_calendly));
            const dateStr = apt.appointment_date ? apt.appointment_date.replace(' ', 'T') : '';
            const start = dateStr ? new Date(dateStr) : new Date();
            const duration = apt.duration_minutes || 30;
            const end = new Date(start.getTime() + duration * 60000);

            setDisplayData({
                title: apt.subject,
                date: formatDate(start),
                timeStart: tConvert(start.toTimeString().slice(0, 5)),
                timeEnd: tConvert(end.toTimeString().slice(0, 5)),
                // The API sends the time in this browser's zone.
                location: timeZoneLabel(browserTimeZone()),
                description: apt.description || "No Description",
                scheduledBy: apt.scheduled_by?.name || "FCH Admin",
                assignedFor: apt.assigned_for?.name || "N/A",
                assignedForId: apt.assigned_for?.entity_id || apt.assigned_for?.id,
                assignedForType: apt.assigned_for?.entity_type || null,
                assignedForAvatar: apt.assigned_for?.image || apt.assigned_for?.avatar || apt.assigned_for?.profile_picture || null,
                appointmentCode: apt.appointment_code || '',
                category: apt.meeting_type || 'Business Review',
                scheduledById: apt.scheduled_by?.id || null,
                status: apt.status ?? null,
                startsAt: dateStr ? start : null,
                assignedForUserId: apt.assigned_for?.id ?? null,
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
                location: browserTimeZone(),
                description: apt.description || "",
                date: localDateString(start),
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
                    location: browserTimeZone(),
                    description: apt.description || "",
                    date: localDateString(start),
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

    /**
     * Books the picked date and start time in Calendly (its event type sets the
     * length); Calendly emails both people the invitation. A time not open in
     * Calendly is refused by the API with that day's open times.
     */
    const submitToCalendly = async () => {
        if (!formData.subject.trim()) {
            setFormErrors({ subject: 'Appointment title is required' });
            return;
        }
        if (!calendlyEventType || !formData.date || !formData.timeStart || (calendlyAsksLocation && !calendlyLocation.trim())) return;

        // With the partner's Calendly the borrower is the invitee (nobody to pick);
        // in their own Calendly they invite the person picked under "Appointment With".
        const payload: Record<string, unknown> = {
            event_type_uri: calendlyEventType.uri,
            // Local wall time in the chosen zone; the API reads it in `timezone`.
            start_time: `${formData.date} ${formData.timeStart}:00`,
            timezone: formData.location,
            subject: formData.subject.trim(),
            meeting_type: formData.category,
        };
        if (booksInOwnCalendly) {
            if (!formData.assigned_for) {
                setFormErrors({ assigned_for: 'Choose who the meeting is with' });
                return;
            }
            payload.assigned_for = Number(formData.assigned_for);
        }
        if (calendlyLocationChoice) payload.location_kind = calendlyLocationChoice.kind;
        if (calendlyAsksLocation) payload.location = calendlyLocation.trim();
        if (formData.description) payload.description = formData.description;

        try {
            setIsSubmitting(true);
            const response = await bookCalendlyAppointment(payload as any);
            toast.success(response?.message || 'Meeting booked in Calendly');
            if (modalInstance) modalInstance.hide();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
                // No usable number in FCH for a phone call: ask for it here.
                if (error.response.data.errors.location) setAskCalendlyPhone(true);
            } else {
                toast.error(error.response?.data?.message || 'Calendly could not book this meeting');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        setFormErrors({});

        if (inCalendly) {
            await submitToCalendly();
            return;
        }

        const toMySQLDate = (date: Date): string => {
            const pad = (num: number): string | number => (num < 10 ? '0' + num : num);
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        // Fetch description
        const descVal = formData.description;

        const startDateTime = new Date(`${formData.date}T${formData.timeStart}`);
        // An end at or before the start is on the next day (R2 BUG-024).
        const durationMinutes = minutesBetween(formData.timeStart, formData.timeEnd);

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
                const isOverlap = (formData.timeStart < cEnd && endWithinDay(formData.timeStart, formData.timeEnd) > cStart);
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

    // The client cancels one the host booked with them (R2 BUG-046): kept, marked
    // cancelled, and the organiser is emailed.
    const canCancel = !viewMode || !displayData.startsAt ? false : canCancelAppointment({
        status: displayData.status,
        startsAt: displayData.startsAt,
        scheduledById: displayData.scheduledById,
        assignedForUserId: displayData.assignedForUserId,
    }, currentUser?.id);

    const handleCancelAppointment = async () => {
        if (!selectedEventId) return;
        try {
            setIsCancelling(true);
            const response = await cancelAppointment(selectedEventId);
            toast.success(response?.message || 'Appointment cancelled.');
            setShowCancelConfirm(false);
            if (modalInstance) modalInstance.hide();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to cancel the appointment');
        } finally {
            setIsCancelling(false);
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
                    setFormData(prev => {
                        const open = startSlotsFrom(TIME_SLOTS, dateStr);
                        if (!dateStr || open.some(slot => slot.value === prev.timeStart)) return { ...prev, date: dateStr };
                        // That time has passed today: move to the next one still ahead.
                        const next = open[0]?.value ?? prev.timeStart;
                        return { ...prev, date: dateStr, timeStart: next, timeEnd: timeAfter(next) };
                    });
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
                                                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanHtml(description)) }}
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

                                    {canCancel && (
                                        <div className="mt-4 pt-4 border-top d-flex justify-content-end">
                                            <button className="btn btn-soft-warning fw-bold text-uppercase fs-12 px-4 shadow-none" onClick={() => setShowCancelConfirm(true)} disabled={isCancelling} style={{ height: '40px' }}>
                                                <i className="ri-close-circle-line me-1 align-middle"></i> {isCancelling ? "Cancelling..." : "Cancel Appointment"}
                                            </button>
                                        </div>
                                    )}

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

                                    {/* Booked in the partner's Calendly, the meeting is with the partner: the borrower is the
                                        invitee. In their own Calendly they invite the person they pick here. */}
                                    {(!inCalendly || booksInOwnCalendly) && (
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
                                    )}

                                    <div className="col-12 position-relative px-0 mb-2" style={{ minHeight: '38px' }}>
                                        <div className="row mx-0">
                                            <div className="col-12 mb-3 px-2">
                                                <label className="form-label fs-13 fw-semibold">Event Date <span className="text-danger">*</span></label>
                                                <div className="input-group">
                                                    <input type="text" ref={dateInputRef} id="event-start-date-modal"
                                                        className={`form-control ${formErrors.appointment_date ? 'is-invalid' : ''}`}
                                                        value={formData.date} readOnly placeholder="Select date" />
                                                    <span className="input-group-text bg-light"><i className="ri-calendar-event-line text-muted"></i></span>
                                                </div>
                                            </div>
                                            {/* Synced with Calendly too: the same date and start; Calendly's event type sets the length. */}
                                            <div className="col-12 mb-3 px-2">
                                                <label className="form-label fs-13 fw-semibold">Time Slot <span className="text-danger">*</span></label>
                                                <div className="d-flex align-items-center gap-2 time-slot-container">
                                                    <Dropdown value={formData.timeStart} options={startOptions}
                                                        onChange={(e) => {
                                                            const startVal = e.value;
                                                            // Half an hour later, past midnight too (R2 BUG-024).
                                                            setFormData(p => ({ ...p, timeStart: startVal, timeEnd: timeAfter(startVal) }));
                                                        }}
                                                        className={`flex-grow-1 ${formErrors.timeStart ? 'p-invalid' : ''}`} placeholder="Start" appendTo="self" />
                                                    <span className="text-muted fw-bold">to</span>
                                                    {calendlySynced ? (
                                                        // Calendly sets the length: the end is shown, not picked.
                                                        <input type="text" readOnly aria-label="End"
                                                            className="form-control flex-grow-1 calendly-end-time"
                                                            style={{ minWidth: 0, flex: '1 1 0' }}
                                                            value={timeLabel(formData.timeEnd)} />
                                                    ) : (
                                                        <Dropdown value={formData.timeEnd}
                                                            options={endSlotsAfter(TIME_SLOTS, formData.timeStart)}
                                                            onChange={(e) => {
                                                                setFormData(p => ({ ...p, timeEnd: e.value }));
                                                            }}
                                                            className={`flex-grow-1 ${formErrors.timeEnd || formErrors.duration_minutes ? 'p-invalid' : ''}`} placeholder="End" appendTo="self" />
                                                    )}
                                                </div>
                                                {calendlySynced && !timeSlotError && calendlyEventType && (
                                                    <div className="text-muted fs-11 mt-1">Calendly books {calendlyMinutes} min ({calendlyEventType.name}).</div>
                                                )}
                                                {timeSlotError && <div className="text-danger fs-11 mt-1">{timeSlotError}</div>}
                                            </div>
                                            {/* The date/time refused (e.g. a time Calendly does not offer): full width under
                                                the date and time - a Calendly reason with its open times is long. */}
                                            {formErrors.appointment_date && (
                                                <div className="col-12 px-2 mb-3 appointment-date-error">
                                                    <div className="alert alert-danger-subtle border border-danger-subtle d-flex align-items-start mb-0 py-2 fs-12" role="alert">
                                                        <i className="ri-error-warning-fill me-2 fs-16 text-danger"></i>
                                                        <span className="text-danger">{([] as string[]).concat(formErrors.appointment_date)[0]}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Availability Alert - Animated Collapse */}
                                    <div className="col-12 px-2 overflow-hidden"
                                        style={{ transition: 'all 0.4s ease', maxHeight: !calendlySynced && isConflictVisible && (availabilityConflicts || lastConflictingAttempt) ? '200px' : '0', opacity: !calendlySynced && isConflictVisible ? 1 : 0, marginBottom: !calendlySynced && isConflictVisible && (availabilityConflicts || lastConflictingAttempt) ? '1rem' : '0' }}>
                                        {!calendlySynced && (availabilityConflicts || lastConflictingAttempt) && (
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

                                    {/* Synced with Calendly: the picked time overlaps (outside Calendly's hours, or already booked). */}
                                    {/* While Calendly is checked (a new date or person): one skeleton, where the answer appears. */}
                                    {calendlySynced && (checkingCalendly || (calendlyOverlap && searchingNextOpen)) && (
                                        <div className="col-12 px-2 mb-3" aria-busy="true" aria-label="Checking Calendly availability">
                                            <Skeleton width="100%" height="56px" className="rounded-2" />
                                        </div>
                                    )}
                                    {calendlyOverlap && !searchingNextOpen && (
                                        <div className="col-12 px-2 mb-3 calendly-overlap">
                                            <div className="alert alert-light border d-flex align-items-start mb-0 py-2" role="status">
                                                <i className="ri-time-line me-2 fs-18 text-primary"></i>
                                                <div className="flex-grow-1">
                                                    <strong className="fs-13 text-dark">Pick an open time</strong>
                                                    <span className="fs-12 text-muted d-block mt-1">
                                                        <span className="fw-bold">{tConvert(formData.timeStart)} - {tConvert(formData.timeEnd)}</span> on <span className="fw-bold">{formData.date}</span>{' '}
                                                        {calendlyOverlapBooked
                                                            ? <>is <span className="fw-bold">already booked</span> - another meeting (in Calendly or here) is at that time.</>
                                                            : calendlyHours
                                                                ? <>is <span className="fw-bold">outside Calendly&apos;s hours</span> that day (<span className="fw-bold">{tConvert(calendlyHours.from)} - {tConvert(calendlyHours.to)}</span>).</>
                                                                : formData.date === localDateString()
                                                                    ? <>has <span className="fw-bold">no open time in Calendly</span> - Calendly isn&apos;t taking bookings for the rest of today: it needs more notice before a meeting (its &quot;minimum notice&quot; setting), or its hours are over.</>
                                                                    : <>has <span className="fw-bold">no open time in Calendly</span> - Calendly is closed that day (no available hours).</>}
                                                    </span>
                                                    {calendlyOpenTimes.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="fs-12 text-muted d-block mb-1">Open start times on {formData.date} ({calendlyMinutes} min each):</span>
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {calendlyOpenTimes.map(slot => (
                                                                    <button key={slot.start_time} type="button" className="btn btn-sm btn-outline-primary py-0 px-2 fs-11"
                                                                        onClick={() => pickCalendlyTime(formData.date, slot)}>
                                                                        {slot.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {calendlyOpenTimes.length === 0 && !findingNextOpen && !calendlyNextOpen && (
                                                        <span className="fs-12 text-muted d-block mt-2">No open day in Calendly in the next 7 days - check its availability in Calendly.</span>
                                                    )}
                                                    {calendlyOpenTimes.length === 0 && calendlyNextOpen && (
                                                        <div className="mt-2 calendly-next-open">
                                                            <span className="fs-12 text-muted d-block mb-1">Next open day - <span className="fw-bold">{calendlyNextOpen.date}</span>:</span>
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {calendlyNextOpen.slots.map(slot => (
                                                                    <button key={slot.start_time} type="button" className="btn btn-sm btn-outline-primary py-0 px-2 fs-11"
                                                                        onClick={() => pickCalendlyTime(calendlyNextOpen.date, slot)}>
                                                                        {slot.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {calendlySynced && calendlyCheckError && (
                                        <div className="col-12 px-2 mb-3">
                                            <div className="text-danger fs-12" role="alert">{calendlyCheckError}</div>
                                        </div>
                                    )}
                                    {/* Skeleton Loader for Availability Check */}
                                    {isCheckingAvailability && !calendlySynced && (
                                        <div className="col-12 px-2 mt-2">
                                                <div className="alert alert-light border d-flex align-items-center mb-0 py-2 fs-12" role="status" aria-live="polite">
                                                    <span className="spinner-border spinner-border-sm text-primary me-2 flex-shrink-0" style={{ width: 16, height: 16 }} aria-hidden="true"></span>
                                                    <span className="text-muted">Checking availability…</span>
                                                </div>
                                        </div>
                                    )}

                                    <div className="col-12 mb-3">
                                        <label className="form-label fs-13 fw-semibold" htmlFor="appointment-time-zone">Time Zone</label>
                                        <input id="appointment-time-zone" type="text" readOnly
                                            className={`form-control ${formErrors.timezone ? 'is-invalid' : ''}`}
                                            value={timeZoneLabel(formData.location)} />
                                        <div className="text-muted fs-11 mt-1">Times are booked and shown in your time zone.</div>
                                        {formErrors.timezone && <div className="text-danger fs-11 mt-1">{formErrors.timezone}</div>}
                                    </div>

                                    <div className="col-12 mb-3">
                                        <label className="form-label fs-13 fw-semibold">Description</label>
                                        <div ref={descriptionRef as React.RefObject<HTMLDivElement>}></div>
                                    </div>

                                    {/* Only when the borrower's partner's Calendly is connected. */}
                                    {canBookInCalendly && (
                                        <div className="col-12 mb-3">
                                            <div className="form-check">
                                                <input className="form-check-input" type="checkbox" id="book-in-calendly-toggle"
                                                    checked={bookInCalendly}
                                                    // In their own Calendly: first who it is with, then Calendly.
                                                    disabled={calendlyNeedsPerson}
                                                    onChange={(e) => setBookInCalendly(e.target.checked)} />
                                                <label className="form-check-label ms-1" htmlFor="book-in-calendly-toggle">Sync with Calendly</label>
                                            </div>
                                            <div className="text-muted fs-11 mt-1">
                                                {calendlyNeedsPerson
                                                    ? 'Choose who the meeting is with ("Appointment With") first - then Calendly is checked for that person.'
                                                    : booksInOwnCalendly
                                                    ? 'Also booked in your Calendly at this date and time; Calendly sends both people the invitation.'
                                                    : "Also booked with your advisor's Calendly at this date and time; Calendly emails you the invitation."}
                                            </div>
                                        </div>
                                    )}

                                    {/* Editing a Calendly meeting: it stays synced - a new title or time is changed in Calendly too. */}
                                    {!isNewEvent && editingCalendlyMeeting && (
                                        <div className="col-12 mb-3 calendly-synced">
                                            <div className="form-check">
                                                <input className="form-check-input" type="checkbox" id="synced-with-calendly" checked disabled readOnly />
                                                <label className="form-check-label ms-1" htmlFor="synced-with-calendly">Sync with Calendly</label>
                                            </div>
                                            <div className="text-muted fs-11 mt-1">
                                                This meeting is in Calendly: a new title or time is changed there too, and Calendly sends both people the update. Deleting it cancels it in Calendly.
                                            </div>
                                        </div>
                                    )}

                                    {inCalendly && (
                                        <>
                                            {!loadingEventTypes && calendlyEventTypes.length === 0 && (
                                                <div className="col-12 mb-3">
                                                    <div className="text-danger fs-12" role="alert">
                                                        This Calendly has no event type switched on yet - please book a normal appointment.
                                                    </div>
                                                </div>
                                            )}

                                            {/* Several places offered (Calendly's "All options"): which one. */}
                                            {calendlyLocationOptions.length > 1 && (
                                                <div className="col-12 mb-3 calendly-location-kind">
                                                    <label className="form-label fs-13 fw-semibold">Location <span className="text-danger">*</span></label>
                                                    <Dropdown
                                                        value={calendlyLocationChoice?.kind || null}
                                                        options={calendlyLocationOptions.map(option => ({ label: option.label, value: option.kind }))}
                                                        onChange={(e) => { setCalendlyLocationKind(e.value); setCalendlyLocation(''); }}
                                                        className={`w-100 ${formErrors.location_kind ? 'p-invalid' : ''}`} appendTo="self" />
                                                    {formErrors.location_kind && <div className="text-danger fs-11 mt-1">{([] as string[]).concat(formErrors.location_kind)[0]}</div>}
                                                </div>
                                            )}

                                            {calendlyAsksLocation && (
                                                <div className="col-12 mb-3">
                                                    <label className="form-label fs-13 fw-semibold" htmlFor="calendly-location">
                                                        {calendlyLocationLabel} <span className="text-danger">*</span>
                                                    </label>
                                                    <input id="calendly-location" type={calendlyLocationKindInUse === 'outbound_call' ? 'tel' : 'text'}
                                                        className={`form-control ${formErrors.location ? 'is-invalid' : ''}`}
                                                        maxLength={255} value={calendlyLocation}
                                                        placeholder={calendlyLocationKindInUse === 'outbound_call' ? 'e.g. +880 1711 000000' : ''}
                                                        onChange={(e) => setCalendlyLocation(e.target.value)} />
                                                    <div className="text-muted fs-11 mt-1">This Calendly event type needs it - Calendly will not book without it.</div>
                                                    {formErrors.location && <div className="invalid-feedback d-block">{([] as string[]).concat(formErrors.location)[0]}</div>}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="hstack gap-2 justify-content-end mt-4 pt-3 border-top">
                                    <button type="button" className="btn btn-light" onClick={handleCancel}>Cancel</button>
                                    <button type="submit" className="btn btn-primary"
                                        disabled={isSubmitting || (inCalendly
                                            ? (loadingEventTypes || !calendlyEventType || checkingCalendly || calendlyOverlap || isCheckingAvailability || isConflictVisible || (calendlyAsksLocation && !calendlyLocation.trim()))
                                            : (isCheckingAvailability || isConflictVisible
                                                // Editing a Calendly meeting: not while Calendly is asked, nor at a time it is not open.
                                                || (calendlySynced && (checkingCalendly || calendlyOverlap))))}>
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

            <ConfirmationModal
                show={showCancelConfirm}
                onClose={() => !isCancelling && setShowCancelConfirm(false)}
                onConfirm={handleCancelAppointment}
                title="Cancel this appointment?"
                message={`"${displayData.title}" will be cancelled and ${displayData.scheduledBy || 'the organiser'} will be told by email.`}
                confirmText="Yes, Cancel It"
                cancelText="Keep It"
                loading={isCancelling}
                loadingText="Cancelling..."
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
