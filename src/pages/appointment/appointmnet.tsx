import React, { useEffect } from 'react'

export default function Appointmnet() {
  useEffect(() => {
    const w = window as unknown as { initCalendar?: () => void }
    let attempts = 0
    const max = 40
    const t = setInterval(() => {
      const hasFn = typeof w.initCalendar === 'function'
      const hasEl = !!document.getElementById('calendar')
      if (hasFn && hasEl) {
        w.initCalendar?.()
        clearInterval(t)
      } else if (++attempts >= max) {
        clearInterval(t)
      }
    }, 100)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="row">
              <div className="col-xl-9 order-2 order-xl-1">
                <div className="card card-h-100">
                  <div className="card-body">
                    <div id="calendar"></div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 order-1 order-xl-2">
                <div className="card card-h-100 mb-3">
                  <div className="card-body">
                    <div className="mb-3">
                      <button className="btn btn-dark w-100" id="btn-new-event">+ Schedule Call</button>
                    </div>
                    <div className="d-flex flex-column gap-2" id="external-events">
                      <div className="external-event d-flex align-items-center p-2 rounded border" data-class="bg-primary-subtle">
                        <i className="mdi mdi-checkbox-blank-circle me-2 text-success"></i>
                        <span>Business Credit/Funding Call</span>
                      </div>
                      <div className="external-event d-flex align-items-center p-2 rounded border" data-class="bg-info-subtle">
                        <i className="mdi mdi-checkbox-blank-circle me-2 text-info"></i>
                        <span>Follow-up Call/Meeting</span>
                      </div>
                      <div className="external-event d-flex align-items-center p-2 rounded border" data-class="bg-warning-subtle">
                        <i className="mdi mdi-checkbox-blank-circle me-2 text-warning"></i>
                        <span>Business Funding Partnership</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <a href="tel:8158396666" className="btn btn-outline-dark w-100"><i className="ri-phone-fill me-2"></i> 815-839-6666</a>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2">All Appointments</h6>
                    <div className="pe-2 me-n1" data-simplebar style={{ height: 180 }}>
                      <div id="upcoming-event-list"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ clear: 'both' }}></div>

            <div className="modal fade" id="event-modal" tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0">
                  <div className="modal-header p-3 bg-info-subtle">
                    <h5 className="modal-title" id="modal-title">Event</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-hidden="true"></button>
                  </div>
                  <div className="modal-body p-4">
                    <form className="needs-validation" name="event-form" id="form-event" noValidate>
                      <div className="text-end">
                        <a href="#" className="btn btn-sm btn-soft-primary" id="edit-event-btn" data-id="edit-event" role="button">Edit</a>
                      </div>
                      <div className="event-details">
                        <div className="d-flex mb-2">
                          <div className="flex-grow-1 d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <i className="ri-calendar-event-line text-muted fs-16"></i>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="d-block fw-semibold mb-0" id="event-start-date-tag"></h6>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <div className="flex-shrink-0 me-3">
                            <i className="ri-time-line text-muted fs-16"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="d-block fw-semibold mb-0"><span id="event-timepicker1-tag"></span> - <span id="event-timepicker2-tag"></span></h6>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <div className="flex-shrink-0 me-3">
                            <i className="ri-map-pin-line text-muted fs-16"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="d-block fw-semibold mb-0"> <span id="event-location-tag"></span></h6>
                          </div>
                        </div>
                        <div className="d-flex mb-3">
                          <div className="flex-shrink-0 me-3">
                            <i className="ri-discuss-line text-muted fs-16"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="d-block text-muted mb-0" id="event-description-tag"></p>
                          </div>
                        </div>
                      </div>
                      <div className="row event-form">
                        <div className="col-12">
                          <div className="mb-3">
                            <label className="form-label">Appointment Title</label>
                            <input className="form-control d-none" placeholder="Enter Appointment Title" type="text" name="title" id="event-title" required />
                            <div className="invalid-feedback">Please provide a valid Appointment Title</div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="mb-3">
                            <label className="form-label">Type</label>
                            <select className="form-select d-none" name="category" id="event-category" required>
                              <option value="bg-danger-subtle">Initial Consultation</option>
                              <option value="bg-success-subtle">Follow-up Meeting</option>
                              <option value="bg-primary-subtle">Business Review</option>
                              <option value="bg-info-subtle">Technical Support</option>
                              <option value="bg-dark-subtle">Feedback Session</option>
                              <option value="bg-warning-subtle">Partnership Meeting</option>
                            </select>
                            <div className="invalid-feedback">Please select a valid event category</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label>Event Date</label>
                            <div className="input-group">
                              <input type="text" id="event-start-date" className="form-control flatpickr flatpickr-input" placeholder="Select date" readOnly required />
                              <span className="input-group-text"><i className="ri-calendar-event-line"></i></span>
                            </div>
                          </div>
                        </div>
                        <div className="col-6" id="event-time">
                          <div className="mb-3">
                            <label className="form-label">Time Slot</label>
                            <select id="time-slot-select" className="form-select" defaultValue="">
                              <option value="" disabled>Select a time</option>
                              <option value="00:00">12:00 AM</option>
                              <option value="01:00">01:00 AM</option>
                              <option value="02:00">02:00 AM</option>
                              <option value="03:00">03:00 AM</option>
                              <option value="04:00">04:00 AM</option>
                              <option value="05:00">05:00 AM</option>
                              <option value="06:00">06:00 AM</option>
                              <option value="07:00">07:00 AM</option>
                              <option value="08:00">08:00 AM</option>
                              <option value="09:00">09:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="13:00">01:00 PM</option>
                              <option value="14:00">02:00 PM</option>
                              <option value="15:00">03:00 PM</option>
                              <option value="16:00">04:00 PM</option>
                              <option value="17:00">05:00 PM</option>
                              <option value="18:00">06:00 PM</option>
                              <option value="19:00">07:00 PM</option>
                              <option value="20:00">08:00 PM</option>
                              <option value="21:00">09:00 PM</option>
                              <option value="22:00">10:00 PM</option>
                              <option value="23:00">11:00 PM</option>
                            </select>
                            <input id="timepicker1" type="text" className="form-control flatpickr flatpickr-input d-none" readOnly />
                            <input id="timepicker2" type="text" className="form-control flatpickr flatpickr-input d-none" readOnly />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="mb-3">
                            <label htmlFor="event-location">Time Zone</label>
                            <select className="form-select d-none" name="event-location" id="event-location" defaultValue="">
                              <option value="" disabled>Select time zone</option>
                              <option value="UTC">UTC (GMT+00:00)</option>
                              <option value="America/New_York">America/New_York (GMT-05:00)</option>
                              <option value="America/Chicago">America/Chicago (GMT-06:00)</option>
                              <option value="America/Denver">America/Denver (GMT-07:00)</option>
                              <option value="America/Los_Angeles">America/Los_Angeles (GMT-08:00)</option>
                              <option value="Europe/London">Europe/London (GMT+00:00)</option>
                              <option value="Europe/Berlin">Europe/Berlin (GMT+01:00)</option>
                              <option value="Asia/Dubai">Asia/Dubai (GMT+04:00)</option>
                              <option value="Asia/Kolkata">Asia/Kolkata (GMT+05:30)</option>
                              <option value="Asia/Singapore">Asia/Singapore (GMT+08:00)</option>
                              <option value="Asia/Tokyo">Asia/Tokyo (GMT+09:00)</option>
                              <option value="Australia/Sydney">Australia/Sydney (GMT+10:00)</option>
                            </select>
                          </div>
                        </div>
                        <input type="hidden" id="eventid" name="eventid" />
                        <div className="col-12">
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea className="form-control d-none" id="event-description" placeholder="Enter a description" rows={3}></textarea>
                          </div>
                        </div>
                      </div>
                      <div className="hstack gap-2 justify-content-end">
                        <button type="button" className="btn btn-soft-danger" id="btn-delete-event"><i className="ri-close-line align-bottom"></i> Delete</button>
                        <button type="submit" className="btn btn-success" id="btn-save-event">Confirm Appointment</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
