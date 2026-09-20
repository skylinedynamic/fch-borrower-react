import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchAppointmentById, createAppointment, updateAppointment, deleteAppointment } from '../../../src/modules/appointment/services'

afterEach(() => server.resetHandlers())

describe('appointment services', () => {
  it('fetchAppointmentById unwraps the data object', async () => {
    server.use(
      http.get('*/common/appointments/7', () => HttpResponse.json({ status: true, data: { id: 7, title: 'Consult' } }))
    )
    await expect(fetchAppointmentById(7)).resolves.toEqual({ id: 7, title: 'Consult' })
  })

  it('createAppointment posts the payload', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/common/appointments', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: { id: 1 } })
      })
    )
    await createAppointment({ title: 'New Meeting' } as any)
    expect(receivedBody).toEqual({ title: 'New Meeting' })
  })

  it('updateAppointment PUTs the partial payload to the id-scoped route', async () => {
    let calledPath = ''
    server.use(
      http.put('*/common/appointments/:id', ({ request }) => {
        calledPath = new URL(request.url).pathname
        return HttpResponse.json({ status: true, data: { id: 5 } })
      })
    )
    await updateAppointment(5, { subject: 'Rescheduled' })
    expect(calledPath.endsWith('/common/appointments/5')).toBe(true)
  })

  it('deleteAppointment DELETEs by id', async () => {
    server.use(
      http.delete('*/common/appointments/3', () => HttpResponse.json({ status: true, message: 'Cancelled' }))
    )
    await expect(deleteAppointment(3)).resolves.toEqual({ status: true, message: 'Cancelled' })
  })
})
