type CancellableAppointment = {
  status?: string | null
  /** When it starts. */
  startsAt: Date
  scheduledById?: number | string | null
  assignedForUserId?: number | string | null
}

const CLOSED_STATUSES = ['cancelled', 'completed']

/**
 * Whether the signed-in user may cancel this appointment: they are the one
 * it is with, not its organiser (who deletes or edits it instead), and it is
 * still ahead and open. A client could not cancel one the host booked with
 * them (R2 BUG-046). The API applies the same rule.
 */
export function canCancelAppointment(appointment: CancellableAppointment, userId: number | string | null | undefined, now: Date = new Date()): boolean {
  if (userId === null || userId === undefined) return false
  if (String(appointment.assignedForUserId) !== String(userId)) return false
  if (String(appointment.scheduledById) === String(userId)) return false
  if (appointment.status && CLOSED_STATUSES.includes(appointment.status.toLowerCase())) return false

  return appointment.startsAt.getTime() > now.getTime()
}
