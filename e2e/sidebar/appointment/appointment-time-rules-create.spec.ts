import type { APIRequestContext, Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { API_BASE_URL } from '../../support/env'

// BUG-078 / 079 / 080 against the real API, as the E2E borrower: a time is
// entered in the booker's zone and stored in UTC, read back in the viewer's
// zone; the same slot twice and a time already passed are refused. The
// calendar form would stop a clash before sending it, so these go to the API
// directly. Everything created is deleted again.

const pad = (n: number) => String(n).padStart(2, '0')

async function api(page: Page) {
  await page.goto('/appointment')
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}').state?.token as string)
  expect(token).toBeTruthy()
  const headers = (zone = 'Asia/Dhaka') => ({ Authorization: `Bearer ${token}`, Accept: 'application/json', 'X-Timezone': zone })
  return { request: page.request, headers }
}

async function someoneToMeet(request: APIRequestContext, headers: Record<string, string>): Promise<number> {
  const users = await (await request.post(`${API_BASE_URL}/common/appointments/fetch-selectable-users`, { headers, data: {} })).json()
  expect(users.data?.length, 'the E2E borrower has someone to book').toBeGreaterThan(0)
  return users.data[0].id
}

test.describe('Sidebar › Appointment (time rules)', () => {
  test('stores the time in UTC, reads it in each zone, and refuses a clash and a past time', async ({ page }) => {
    const { request, headers } = await api(page)
    const with_ = await someoneToMeet(request, headers())

    // 10:00 in Dhaka, 12 days out, at a minute no other test uses.
    const day = new Date()
    day.setDate(day.getDate() + 12)
    const local = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())} 10:17:00`
    const booking = (date: string, timezone = 'Asia/Dhaka') => ({
      subject: `E2E time rules ${Date.now()}`, appointment_date: date, timezone,
      duration_minutes: 30, meeting_type: 'Business Review', assigned_for: with_,
    })

    const created = await request.post(`${API_BASE_URL}/common/appointments`, { headers: headers(), data: booking(local) })
    expect(created.status(), await created.text()).toBe(200)
    const id = (await created.json()).data.id

    try {
      // Read back in Dhaka as entered, and in UTC six hours earlier.
      const inDhaka = await (await request.get(`${API_BASE_URL}/common/appointments/${id}`, { headers: headers('Asia/Dhaka') })).json()
      expect(inDhaka.data.appointment_date).toBe(local)
      const inUtc = await (await request.get(`${API_BASE_URL}/common/appointments/${id}`, { headers: headers('UTC') })).json()
      expect(inUtc.data.appointment_date).toBe(local.replace('10:17:00', '04:17:00'))

      // The same slot again is refused, with who and when.
      const clash = await request.post(`${API_BASE_URL}/common/appointments`, { headers: headers(), data: booking(local) })
      expect(clash.status()).toBe(422)
      expect((await clash.json()).errors.appointment_date).toMatch(/already ha(s|ve) an appointment from 10:17 AM to 10:47 AM/)

      // A time that has already passed is refused.
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const past = `${hourAgo.getUTCFullYear()}-${pad(hourAgo.getUTCMonth() + 1)}-${pad(hourAgo.getUTCDate())} ${pad(hourAgo.getUTCHours())}:${pad(hourAgo.getUTCMinutes())}:00`
      const late = await request.post(`${API_BASE_URL}/common/appointments`, { headers: headers(), data: booking(past, 'UTC') })
      expect(late.status()).toBe(422)
      expect((await late.json()).errors.appointment_date).toBe('This time has already passed. Choose a later time.')
    } finally {
      await request.delete(`${API_BASE_URL}/common/appointments/${id}`, { headers: headers() })
    }
  })
})
