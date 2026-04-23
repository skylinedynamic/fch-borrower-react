import React, { useEffect, useRef, useState } from 'react';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';

// Toast
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Store
import { useAuthStore } from '../../store/auth/authStore';


// API Services
import { fetchAppointments, updateAppointment } from '../../modules/appointment/services';

// Config
import { APPOINTMENT_STATUS_CONFIG } from '../../config/appointmentTypeOptions';

// Components
import AppointmentModal from './AppointmentModal';

export default function Appointments() {
  const calendarRef = useRef(null);
  const appointmentModalRef = useRef(null);

  // Auth
  const { user } = useAuthStore();


  // Events data
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  // Fetch Appointments
  useEffect(() => {
    loadAppointments();
  }, []);

  // Sync formData description updates back to Summernote if it changes externally (e.g. reset)
  // Be careful not to cause loops. Usually optional if one-way binding is sufficient.


  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetchAppointments();
      if (response.status && response.data) {
        const mappedEvents = response.data.map(apt => {
          const start = new Date(apt.appointment_date);
          // Calculate end time based on duration_minutes
          const end = new Date(start.getTime() + (apt.duration_minutes || 60) * 60000);

          // High-fidelity palette matched to 'same-to-same' design reference
          const PALETTE = [
            { key: 'blue', bg: '#e0f2fe', border: '#bae6fd', text: '#0369a1' },    // Billing/Support
            { key: 'emerald', bg: '#d1fae5', border: '#a7f3d0', text: '#059669' }, // Marketing
            { key: 'violet', bg: '#ede9fe', border: '#ddd6fe', text: '#7c3aed' },  // Kickoff
            { key: 'sky', bg: '#e0f2fe', border: '#bae6fd', text: '#0284c7' },     // Product Demo
            { key: 'rose', bg: '#fee2e2', border: '#fecaca', text: '#dc2626' },    // Invoice/Release
            { key: 'amber', bg: '#fef3c7', border: '#fde68a', text: '#d97706' },   // Quarterly
            { key: 'gray', bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563' },    // Team Offsite
            { key: 'indigo', bg: '#e0e7ff', border: '#c7d2fe', text: '#4f46e5' },
            { key: 'teal', bg: '#ccfbf1', border: '#99f6e4', text: '#0d9488' },
            { key: 'cyan', bg: '#cffafe', border: '#a5f3fc', text: '#0891b2' },
            { key: 'orange', bg: '#ffedd5', border: '#fed7aa', text: '#d97706' },
            { key: 'fuchsia', bg: '#fae8ff', border: '#f5d0fe', text: '#a21caf' }
          ];

          let style = PALETTE[0]; // Default
          if (apt.status === 'cancelled') {
            style = PALETTE[4]; // Rose/Red
          } else if (apt.status === 'completed') {
            style = PALETTE[1]; // Emerald
          } else {
            // Maximize difference using a prime shift
            const colorIndex = (parseInt(String(apt.id)) * 11) % PALETTE.length;
            style = PALETTE[colorIndex];
          }

          return {
            id: apt.id,
            title: apt.subject,
            start: start,
            end: end,
            allDay: false,
            backgroundColor: style.bg,
            borderColor: style.border,
            textColor: style.text,
            className: `fc-custom-event`,
            description: apt.description,
            location: apt.timezone,
            extendedProps: {
              colorKey: style.key,
              colorClass: `apt-${style.key}`,
              bg: style.bg,
              text: style.text,
              border: style.border,
              description: apt.description,
              location: apt.location,
              timezone: apt.timezone,
              appointment_code: apt.appointment_code,
              status: apt.status,
              meeting_type: apt.meeting_type,
              assigned_for: apt.assigned_for
            }
          };
        });
        setEvents(mappedEvents);
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        console.error("Failed to load appointments due to specific errors:", error.response.data.errors);
        toast.error(error.response.data.errors.join(', ') || 'Failed to load appointments');
      } else {
        console.error("Failed to load appointments", error);
        toast.error('Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const str_dt_fmt = (date: any) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const tConvert = (timeStr: any) => {
    if (!timeStr) return '';
    let [h, m] = timeStr.split(':');
    const ampm = Number(h) >= 12 ? 'PM' : 'AM';
    h = Number(h) % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Update upcoming events list (From Today)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const sorted = [...events].sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const fromToday = sorted.filter((e: any) => new Date(e.start) >= today);
    setUpcomingEvents(fromToday.slice(0, 15)); // Show up to 15
  }, [events]);

  // Actions
  const handleNewEvent = (dateStr?: any) => {
    // Permission check removed

    if (appointmentModalRef.current) {
      (appointmentModalRef.current as any).create(dateStr);
    }
  };

  const handleEventClick = (info: any) => {
    if (appointmentModalRef.current) {
      (appointmentModalRef.current as any).show(info.event.id);
    }
  };

  const handleDropResize = async (info: any) => {
    const calEvent = info.event;
    const start = calEvent.start;
    const end = calEvent.end || new Date(start.getTime() + 30 * 60000);
    const duration = (end.getTime() - start.getTime()) / 60000;

    const toMySQLDate = (date: any) => {
      const pad = (num: any) => (num < 10 ? '0' + num : num);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const props = calEvent.extendedProps;
    const payload = {
      subject: calEvent.title,
      description: props.description,
      appointment_date: toMySQLDate(start),
      timezone: props.timezone,
      duration_minutes: duration,
      meeting_type: props.meeting_type,
      entity_type: props.assigned_for?.entity_type,
      entity_id: props.assigned_for?.entity_id || props.assigned_for?.id,
      assigned_for: props.assigned_for?.id
    };

    try {
      const response = await updateAppointment(calEvent.id, payload);
      if (response && response.status) {
        toast.success(response.message || 'Appointment updated successfully');
        // Refresh local state to ensure all computed properties (colors, etc) are correct
        setEvents(prev => prev.map(e => String(e.id) === String(calEvent.id) ? {
          ...e,
          start: calEvent.start,
          end: calEvent.end,
        } : e));
      } else {
        toast.error(response?.message || 'Failed to update appointment');
        info.revert();
      }
    } catch (error: any) {
      console.error("Update failed", error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update appointment');
      info.revert();
    }
  };

  return (
    <div className="page-content borrower-appointments-wrapper">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container-fluid">
        <div className="row mt-3">
          <div className="col-12">
            <div className="row">
              <div className="col-lg-4 col-xl-3">
                <div className="card card-h-100 mb-4">
                  <div className="card-body">
                    <button className="btn btn-primary w-100" id="btn-new-event" onClick={() => handleNewEvent()}><i className="mdi mdi-plus"></i> Create New Appointment</button>
                    <div id="external-events">{/* External events would go here */}</div>
                  </div>
                </div>
                <div className="mb-3 px-1">
                  <h4 className="fs-18 mb-1" style={{ color: '#313a46' }}>Upcoming Appointment</h4>
                  <p className="text-muted fs-13">Don't miss scheduled appointments</p>
                </div>
                <div className="pe-2 me-n1 mb-3" data-simplebar style={{ height: "750px" }}>
                  <div id="upcoming-event-list">
                    {loading && (
                      <>
                        {[1, 2, 3].map(n => (
                          <div className="card mb-3" key={n} aria-hidden="true">
                            <div className="card-body">
                              <div className="d-flex mb-3 placeholder-glow">
                                <div className="flex-grow-1">
                                  <span className="placeholder col-4 rounded bg-secondary-subtle"></span>
                                </div>
                                <div className="flex-shrink-0">
                                  <span className="placeholder col-3 rounded bg-secondary-subtle"></span>
                                </div>
                              </div>
                              <h6 className="card-title placeholder-glow">
                                <span className="placeholder col-7 rounded bg-secondary-subtle"></span>
                              </h6>
                              <p className="text-muted mb-0 placeholder-glow">
                                <span className="placeholder col-12 rounded bg-secondary-subtle"></span>
                                <span className="placeholder col-8 rounded bg-secondary-subtle"></span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {!loading && upcomingEvents.length === 0 && (
                      <div className="text-center py-5">
                        <p className="text-muted">No upcoming events found</p>
                      </div>
                    )}
                    {!loading && upcomingEvents.map(evt => {
                      const s = new Date(evt.start);
                      const e = evt.end ? new Date(evt.end) : null;

                      let dateStr = str_dt_fmt(s);
                      if (e) {
                        const eDay = new Date(e);
                        if (evt.allDay) {
                          eDay.setDate(eDay.getDate() - 1);
                        }
                        const sStr = str_dt_fmt(s);
                        const eStr = str_dt_fmt(eDay);
                        if (sStr !== eStr) {
                          dateStr = `${sStr} to ${eStr}`;
                        }
                      }

                      const eventStyles = evt.extendedProps?.bg ? {
                        bg: evt.extendedProps.bg,
                        text: evt.extendedProps.text,
                        border: evt.extendedProps.border,
                        key: evt.extendedProps.colorKey || 'info'
                      } : { bg: '#cff4fc', text: '#055160', border: '#9eeaf9', key: 'info' };

                      const colorClass = evt.extendedProps?.colorClass || 'apt-blue';

                      // Status Logic
                      const status = evt.extendedProps?.status || '';
                      const isPast = new Date() > s;
                      let currentStatus = status;
                      if (status === 'pending' && isPast) {
                        currentStatus = 'expired';
                      }

                      const statusCfg = APPOINTMENT_STATUS_CONFIG[currentStatus];
                      const statusLabel = statusCfg?.label || status;
                      const statusClass = statusCfg?.badgeClass || 'bg-info-subtle text-info';

                      let badge;
                      const startTime = s ? tConvert(s.toTimeString().slice(0, 5)) : '';
                      const endTime = e ? tConvert(e.toTimeString().slice(0, 5)) : '';

                      if (evt.allDay || !e || !endTime) {
                        badge = <small className="badge border-0 py-1 px-2 time-badge-item">Full day</small>;
                      } else {
                        badge = <small className="badge border-0 py-1 px-2 time-badge-item">{startTime} to {endTime}</small>;
                      }

                      return (
                        <div className={`card mb-3 upcoming-event-card cursor-pointer shadow-none border ${colorClass}`} key={evt.id}
                          onClick={() => handleEventClick({ event: { id: evt.id } })}
                          style={{ transition: 'all 0.3s ease', borderRadius: '8px' }}>
                          <div className="card-body p-3">
                            <div className="d-flex mb-2 align-items-center justify-content-between flex-nowrap overflow-hidden">
                              <div className="d-flex align-items-center flex-shrink-1 overflow-hidden">
                                <i className="ri-checkbox-blank-circle-fill me-1 flex-shrink-0" style={{ color: eventStyles.text, fontSize: '8px' }}></i>
                                <span className="fw-semibold text-dark fs-11 text-nowrap">{dateStr}</span>
                              </div>
                              <div className="ms-auto flex-shrink-0 d-flex gap-1 align-items-center">
                                <span className="badge fw-medium px-1 py-1 text-nowrap" style={{ backgroundColor: eventStyles.bg, color: eventStyles.text, borderRadius: '4px', fontSize: '10px' }}>
                                  {startTime}-{endTime || 'N/A'}
                                </span>
                                <span className={`badge ${statusClass} text-nowrap`} style={{ borderRadius: '4px', fontSize: '10px', padding: '2px 4px' }}>{statusLabel}</span>
                              </div>
                            </div>
                            <h6 className="card-title mb-2 fs-16" style={{ color: eventStyles.text }}>{evt.title}</h6>
                            <div
                              className="text-muted text-truncate-two-lines mb-0 fs-13"
                              style={{ lineHeight: '1.5', letterSpacing: '0.1px' }}
                              dangerouslySetInnerHTML={{ __html: evt.extendedProps?.description || evt.description || "" }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="col-lg-8 col-xl-9">
                <div className="card card-h-100">
                  <div className="card-body">
                    {loading ? (
                      <div style={{ minHeight: '750px' }} className="placeholder-glow">
                        <div className="d-flex justify-content-between mb-4">
                          <div className="d-flex gap-1">
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '30px', height: '35px' }}></span>
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '30px', height: '35px' }}></span>
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '60px', height: '35px' }}></span>
                          </div>
                          <span className="placeholder rounded bg-secondary-subtle col-3" style={{ height: '35px' }}></span>
                          <div className="d-flex gap-1">
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '60px', height: '35px' }}></span>
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '60px', height: '35px' }}></span>
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '60px', height: '35px' }}></span>
                            <span className="placeholder rounded bg-secondary-subtle" style={{ width: '60px', height: '35px' }}></span>
                          </div>
                        </div>

                        <div className="border rounded">
                          <div className="d-flex border-bottom">
                            {[...Array(7)].map((_, i) => (
                              <div key={i} className="flex-fill border-end p-2 text-center">
                                <span className="placeholder rounded bg-secondary-subtle w-50"></span>
                              </div>
                            ))}
                          </div>
                          {[...Array(5)].map((_, row) => (
                            <div key={row} className="d-flex border-bottom" style={{ height: '100px' }}>
                              {[...Array(7)].map((_, col) => (
                                <div key={col} className="flex-fill border-end p-1">
                                  {((row + col) % 5 === 0) && (
                                    <div className="rounded bg-secondary-subtle mt-3 mx-1" style={{ height: '20px', opacity: 0.5 }}></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div id="calendar" style={{ minHeight: '750px' }}>
                        <FullCalendar
                          ref={calendarRef}
                          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, bootstrap5Plugin]}
                          initialView={window.innerWidth >= 1200 ? "dayGridMonth" : window.innerWidth >= 768 ? "timeGridWeek" : "listMonth"}
                          themeSystem="bootstrap5"
                          headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                          }}
                          buttonText={{
                            today: 'Today',
                            month: 'Month',
                            week: 'Week',
                            day: 'Day',
                            list: 'List'
                          }}
                          eventTimeFormat={{
                            hour: 'numeric',
                            minute: '2-digit',
                            meridiem: 'short'
                          }}
                          events={events}
                          editable={true}
                          droppable={true}
                          selectable={true}
                          height={750}
                          eventDidMount={(info) => {
                            // Force style overrides directly on the DOM
                            const { backgroundColor, borderColor, textColor } = info.event;
                            if (backgroundColor) {
                              (info.el as HTMLElement).style.backgroundColor = backgroundColor;
                              (info.el as HTMLElement).style.setProperty('background-color', backgroundColor, 'important');
                            }
                            if (borderColor) {
                              (info.el as HTMLElement).style.borderColor = borderColor;
                              (info.el as HTMLElement).style.setProperty('border-color', borderColor, 'important');
                              // Also apply to the dot for list/day views
                              const dotEl = (info.el as HTMLElement).querySelector('.fc-daygrid-event-dot') as HTMLElement;
                              if (dotEl) {
                                dotEl.style.borderColor = borderColor;
                                dotEl.style.setProperty('border-color', borderColor, 'important');
                              }
                            }
                            if (textColor) {
                              const titleEl = (info.el as HTMLElement).querySelector('.fc-event-title') as HTMLElement || (info.el as HTMLElement).querySelector('.fc-list-event-title') as HTMLElement;
                              if (titleEl) {
                                titleEl.style.color = textColor;
                                titleEl.style.setProperty('color', textColor, 'important');
                              }
                              (info.el as HTMLElement).style.color = textColor;
                              (info.el as HTMLElement).style.setProperty('color', textColor, 'important');
                            }
                          }}
                          dateClick={(arg) => handleNewEvent(arg.dateStr)}
                          eventClick={handleEventClick}
                          eventDrop={handleDropResize}
                          eventResize={handleDropResize}

                          windowResize={(arg) => {
                            if (window.innerWidth >= 1200) {
                              arg.view.calendar.changeView('dayGridMonth');
                            } else if (window.innerWidth >= 768) {
                              arg.view.calendar.changeView('timeGridWeek');
                            } else {
                              arg.view.calendar.changeView('listMonth');
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
        <AppointmentModal ref={appointmentModalRef} onSuccess={loadAppointments} />
      </div>
    </div>
  );
}
