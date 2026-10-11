import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { http, HttpResponse } from 'msw'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import AppointmentModal, { type AppointmentModalHandle } from '../../../src/pages/appointment/AppointmentModal'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Raw flatpickr (not react-flatpickr) directly manipulates the DOM via its
// own scheduling; not what this component's save/delete logic is testing.
// The options it is called with are recorded, so the picker's setup can be.
const flatpickrCalls = vi.hoisted(() => [] as Array<Record<string, any>>)
vi.mock('flatpickr', () => ({
  default: (_el: unknown, options: Record<string, any>) => {
    flatpickrCalls.push(options)
    return { destroy: () => {}, setDate: () => {} }
  },
}))

// The plugin itself is covered by tests/utils/flatpickrPlugins.test.ts; here
// only the range the modal asks it for matters.
const yearDropdownCalls = vi.hoisted(() => [] as Array<[number | undefined, number | undefined]>)
vi.mock('../../../src/utils/flatpickrPlugins', () => ({
  yearDropdownPlugin: (minYear?: number, maxYear?: number) => {
    yearDropdownCalls.push([minYear, maxYear])
    return { yearDropdown: true }
  },
}))

// Real bootstrap Modal manipulates classList/creates a backdrop via its own
// transition timers; stubbed so show()/hide() are synchronous and inert.
vi.mock('bootstrap/js/dist/modal', () => ({
  default: class {
    show = vi.fn()
    hide = vi.fn()
    dispose = vi.fn()
  },
}))

// useSummernote wires up jQuery/Summernote DOM plugins; the description
// field's rich-text behavior isn't what's under test here.
vi.mock('../../../src/hooks/useSummernote', () => ({
  useSummernote: () => ({ editorRef: { current: null } }),
}))

const resetAuth = () => useAuthStore.setState({ token: 'tok', user: { id: 1, is_host: 0 }, userSubscription: null, rememberMe: true })

const renderModal = () => {
  const ref = createRef<AppointmentModalHandle>()
  const onSuccess = vi.fn()
  const utils = render(<AppointmentModal ref={ref} onSuccess={onSuccess} />)
  return { ...utils, ref, onSuccess }
}

describe('AppointmentModal', () => {
  afterEach(() => {
    server.resetHandlers()
    useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
    vi.restoreAllMocks()
  })

  it('create(): initializes a blank form with sensible defaults and creates the appointment on submit', async () => {
    resetAuth()
    server.use(
      http.post('*/common/appointments/fetch-selectable-users', () => HttpResponse.json({ status: true, data: [] }))
    )
    let receivedBody: any = null
    server.use(
      http.post('*/common/appointments', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Appointment created successfully', data: { id: 1 } })
      })
    )

    const user = userEvent.setup()
    const { ref, onSuccess } = renderModal()

    await act(async () => {
      ref.current!.create()
    })

    const subjectInput = await screen.findByPlaceholderText('Enter appointment title')
    expect((subjectInput as HTMLInputElement).value).toBe('')

    await user.type(subjectInput, 'Quarterly Review')
    await user.click(screen.getByRole('button', { name: /Confirm Appointment/i, hidden: true }))

    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody.subject).toBe('Quarterly Review')
    expect(receivedBody.meeting_type).toBe('Business Review')
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('create(): the date picker uses the shared month/year dropdowns, with future years to pick from', async () => {
    resetAuth()
    server.use(
      http.post('*/common/appointments/fetch-selectable-users', () => HttpResponse.json({ status: true, data: [] }))
    )
    flatpickrCalls.length = 0
    const { ref } = renderModal()

    await act(async () => {
      ref.current!.create()
    })

    await waitFor(() => expect(flatpickrCalls.length).toBeGreaterThan(0))
    const options = flatpickrCalls[flatpickrCalls.length - 1]
    expect(options.minDate).toBe('today')
    expect(options.monthSelectorType).toBe('dropdown')
    expect(options.plugins).toEqual([{ yearDropdown: true }])

    // Appointments are booked forward, so the year list must reach past this year.
    const [minYear, maxYear] = yearDropdownCalls[yearDropdownCalls.length - 1]
    const thisYear = new Date().getFullYear()
    expect(minYear).toBe(thisYear)
    expect(maxYear).toBeGreaterThan(thisYear)
  })

  it('show(id): fetches and displays the appointment in read-only view mode', async () => {
    resetAuth()
    server.use(
      http.get('*/common/appointments/42', () =>
        HttpResponse.json({
          status: true,
          data: {
            id: 42,
            subject: 'Existing Meeting',
            appointment_date: '2026-01-15 10:00:00',
            duration_minutes: 30,
            timezone: 'UTC (GMT+00:00)',
            description: 'Discuss onboarding',
            scheduled_by: { name: 'FCH Admin', id: 9 },
            assigned_for: { name: 'Jane Borrower', id: 5, entity_id: 5, entity_type: 'borrower' },
            meeting_type: 'Business Review',
          },
        })
      )
    )

    const { ref } = renderModal()

    await act(async () => {
      await ref.current!.show(42)
    })

    expect(await screen.findByText('Existing Meeting')).toBeInTheDocument()
  })

  it('confirms before deleting, then calls deleteAppointment', async () => {
    resetAuth()
    server.use(
      http.get('*/common/appointments/7', () =>
        HttpResponse.json({
          status: true,
          data: {
            id: 7,
            subject: 'To Be Deleted',
            appointment_date: '2026-01-15 10:00:00',
            duration_minutes: 30,
            scheduled_by: { name: 'FCH Admin' },
            assigned_for: { name: 'Jane Borrower', id: 5, entity_id: 5, entity_type: 'borrower' },
          },
        })
      )
    )
    let deleteCalled = false
    server.use(
      http.delete('*/common/appointments/7', () => {
        deleteCalled = true
        return HttpResponse.json({ status: true, message: 'Deleted' })
      })
    )

    const user = userEvent.setup()
    const { ref } = renderModal()
    await act(async () => {
      await ref.current!.show(7)
    })
    await screen.findByText('To Be Deleted')

    await user.click(screen.getByRole('button', { name: /delete/i, hidden: true }))
    const confirmButton = await screen.findByRole('button', { name: /Yes, Delete It/i, hidden: true })
    await user.click(confirmButton)

    await waitFor(() => expect(deleteCalled).toBe(true))
  })
})
