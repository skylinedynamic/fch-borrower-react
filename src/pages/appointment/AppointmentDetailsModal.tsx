import React, { useState } from 'react'
import { Modal, ModalBody, ModalHeader, Button, Badge } from 'reactstrap'
import { Appointment } from '../../modules/appointment/types'
import { useDeleteAppointment } from '../../modules/appointment/queries'
import { toast } from 'react-toastify'
// import UserAvatar from '../../assets/images/users/avatar-1.jpg' // Removed invalid import

interface AppointmentDetailsModalProps {
    show: boolean
    onClose: () => void
    appointment: Appointment | null
    onEdit: () => void
    refetch?: () => void
}

export default function AppointmentDetailsModal({ show, onClose, appointment, onEdit, refetch }: AppointmentDetailsModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const deleteMutation = useDeleteAppointment()

    if (!appointment) return null

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return

        setIsDeleting(true)
        try {
            await deleteMutation.mutateAsync(appointment.id)
            toast.success('Appointment deleted')
            refetch?.()
            onClose()
        } catch (err: any) {
            toast.error('Failed to delete appointment')
        } finally {
            setIsDeleting(false)
        }
    }

    // Format Date: 12 Jan, 2026
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    // Format Time: 10:30 AM
    // If we have duration, we can calculate end time
    const formatTime = (dateStr: string, durationMinutes: number) => {
        const start = new Date(dateStr)
        const end = new Date(start.getTime() + durationMinutes * 60000)
        return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    return (
        <Modal isOpen={show} toggle={onClose} centered className="modal-md" contentClassName="border-0 overflow-hidden">
            <ModalHeader toggle={onClose} className="bg-primary-subtle p-3">
                <h5 className="modal-title text-primary">Appointment Details</h5>
            </ModalHeader>
            <ModalBody className="p-4">
                <div className="d-flex align-items-center mb-4">
                    <div className="flex-shrink-0 me-3">
                        <div className="avatar-sm">
                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3 shadow-sm">
                                <i className="ri-calendar-event-fill"></i>
                            </span>
                        </div>
                    </div>
                    <div className="flex-grow-1">
                        <h5 className="mb-1 fs-16 fw-bold text-dark">{appointment.subject}</h5>
                        <p className="text-muted mb-0">
                            <i className="ri-map-pin-line me-1 align-middle text-secondary"></i>
                            {appointment.location || 'Online Meeting'}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        {appointment.status === 'scheduled' && <Badge color="success" className="fs-12">Scheduled</Badge>}
                        {appointment.status === 'cancelled' && <Badge color="danger" className="fs-12">Cancelled</Badge>}
                        {appointment.status === 'completed' && <Badge color="info" className="fs-12">Completed</Badge>}
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-6">
                        <div className="p-3 bg-light rounded border border-light-subtle h-100">
                            <div className="d-flex align-items-center mb-2">
                                <i className="ri-calendar-line text-primary fs-5 me-2"></i>
                                <span className="text-muted text-uppercase fs-11 fw-semibold">Date</span>
                            </div>
                            <h6 className="fs-14 mb-0 fw-semibold">{formatDate(appointment.appointment_date)}</h6>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="p-3 bg-light rounded border border-light-subtle h-100">
                            <div className="d-flex align-items-center mb-2">
                                <i className="ri-time-line text-info fs-5 me-2"></i>
                                <span className="text-muted text-uppercase fs-11 fw-semibold">Time</span>
                            </div>
                            <h6 className="fs-14 mb-0 fw-semibold">{formatTime(appointment.appointment_date, appointment.duration_minutes)}</h6>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="p-3 bg-light rounded border border-light-subtle">
                            <div className="d-flex align-items-center mb-2">
                                <i className="ri-user-follow-line text-success fs-5 me-2"></i>
                                <span className="text-muted text-uppercase fs-11 fw-semibold">Assigned To</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="avatar-xs me-2">
                                    {appointment.assigned_for?.profile_picture ? (
                                        <img src={appointment.assigned_for.profile_picture} alt="" className="img-fluid rounded-circle" />
                                    ) : (
                                        <span className="avatar-title rounded-circle bg-light text-primary fw-medium">
                                            {appointment.assigned_for?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <h6 className="fs-14 mb-0 fw-semibold">{appointment.assigned_for?.name || 'Unassigned'}</h6>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <h6 className="text-muted text-uppercase fs-11 fw-semibold mb-2">Description</h6>
                        <p className="text-muted fs-14 bg-light p-3 rounded border border-light-subtle mb-0">
                            {appointment.description || 'No description provided.'}
                        </p>
                    </div>
                </div>

                <div className="hstack gap-2 justify-content-end mt-4 pt-2 border-top border-light">
                    <Button color="danger" outline onClick={handleDelete} disabled={isDeleting} className="btn-sm">
                        <i className="ri-delete-bin-line align-middle me-1"></i> Delete
                    </Button>
                    <Button color="info" onClick={onEdit} className="btn-sm">
                        <i className="ri-pencil-line align-middle me-1"></i> Edit
                    </Button>
                    <Button color="light" onClick={onClose} className="btn-sm">
                        Close
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    )
}
