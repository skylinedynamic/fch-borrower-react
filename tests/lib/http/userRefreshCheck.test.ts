import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { server } from '../../mocks/server'
import { apiClient } from '../../../src/lib/http/apiClient'
import { clearAuthState, getAuthState, setAuthState } from '../../../src/store/auth/authStore'
import { USER_REFRESHED_EVENT } from '../../../src/config/appConfig'

/**
 * The API flags a borrower with is_refresh when something about them changes
 * while they use the portal - e.g. the host requires or waives their agreement.
 * After any call, the portal looks at user-details and, when flagged, reloads
 * the user (refresh-user) and says so (USER_REFRESHED_EVENT) - no full reload.
 */
const counted = () => {
  const calls = { details: 0, refresh: 0 }
  return calls
}

function stubUser(isRefresh: boolean, calls = counted()) {
  server.use(
    http.get('*/borrower/user-details', () => {
      calls.details += 1
      return HttpResponse.json({ status: true, data: { user: { id: 1, is_refresh: isRefresh && calls.refresh === 0 } } })
    }),
    http.get('*/common/refresh-user', () => {
      calls.refresh += 1
      return HttpResponse.json({ status: true, data: { id: 1, name: 'Fresh Name', is_agreement_signed: false } })
    }),
    http.get('*/borrower/anything', () => HttpResponse.json({ status: true, data: [] })),
    http.get('*/auth/login', () => HttpResponse.json({ status: true, data: [] }))
  )
  return calls
}

beforeEach(() => setAuthState({ token: 'token-1', user: { id: 1, name: 'Old Name' } as never }))
afterEach(() => clearAuthState())

describe('apiClient - picking up a flagged user', () => {
  it('reloads the user and says so when the API has flagged them', async () => {
    const calls = stubUser(true)
    const refreshed = vi.fn()
    window.addEventListener(USER_REFRESHED_EVENT, refreshed)

    await apiClient.get('/borrower/anything')

    await waitFor(() => expect(refreshed).toHaveBeenCalledTimes(1))
    expect(calls.refresh).toBe(1)
    expect(getAuthState().user?.name).toBe('Fresh Name')
    window.removeEventListener(USER_REFRESHED_EVENT, refreshed)
  })

  it('only looks when not flagged - the user is not reloaded', async () => {
    const calls = stubUser(false)

    await apiClient.get('/borrower/anything')

    await waitFor(() => expect(calls.details).toBe(1))
    expect(calls.refresh).toBe(0)
    expect(getAuthState().user?.name).toBe('Old Name')
  })

  it('looks once for calls made together', async () => {
    const calls = stubUser(false)

    await Promise.all([apiClient.get('/borrower/anything'), apiClient.get('/borrower/anything'), apiClient.get('/borrower/anything')])

    await waitFor(() => expect(calls.details).toBe(1))
    await new Promise((r) => setTimeout(r, 30))
    expect(calls.details).toBe(1)
  })

  it('does not look after its own calls, nor without a session', async () => {
    const calls = stubUser(false)

    await apiClient.get('/borrower/user-details')
    await apiClient.get('/auth/login')
    clearAuthState()
    await apiClient.get('/borrower/anything')

    await new Promise((r) => setTimeout(r, 30))
    expect(calls.details).toBe(1) // only the direct call above
    expect(calls.refresh).toBe(0)
  })
})
