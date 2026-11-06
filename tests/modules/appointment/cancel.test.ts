import { describe, expect, it } from 'vitest'
import { canCancelAppointment } from '../../../src/modules/appointment/cancel'

/** R2 BUG-046 - who may cancel an appointment, and when (the API's rule). */
describe('canCancelAppointment', () => {
  const now = new Date('2026-10-26T13:00:00Z')
  const upcoming = { status: 'pending', startsAt: new Date('2026-10-28T09:00:00Z'), scheduledById: 9, assignedForUserId: 1 }

  it('lets the person it is with cancel an upcoming one someone else booked', () => {
    expect(canCancelAppointment(upcoming, 1, now)).toBe(true)
  })

  it('not its organiser, who edits or deletes it instead', () => {
    expect(canCancelAppointment({ ...upcoming, scheduledById: 1 }, 1, now)).toBe(false)
  })

  it('not someone it is not with, or nobody signed in', () => {
    expect(canCancelAppointment(upcoming, 2, now)).toBe(false)
    expect(canCancelAppointment(upcoming, null, now)).toBe(false)
  })

  it('not once it is cancelled, completed, or has started', () => {
    expect(canCancelAppointment({ ...upcoming, status: 'cancelled' }, 1, now)).toBe(false)
    expect(canCancelAppointment({ ...upcoming, status: 'Completed' }, 1, now)).toBe(false)
    expect(canCancelAppointment({ ...upcoming, startsAt: new Date('2026-10-26T12:59:00Z') }, 1, now)).toBe(false)
  })
})
