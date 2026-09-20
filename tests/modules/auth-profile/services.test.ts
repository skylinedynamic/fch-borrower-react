import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { updatePassword, refreshUser } from '../../../src/modules/auth-profile/services'

afterEach(() => server.resetHandlers())

describe('updatePassword', () => {
  it('resolves on success and rejects with the server message on failure', async () => {
    const payload = { current_password: 'old', new_password: 'new', new_password_confirmation: 'new' }
    server.use(http.post('*/borrower/auth-profile/update-password', () => HttpResponse.json({ status: true, message: 'Updated' })))
    await expect(updatePassword(payload)).resolves.toEqual({ status: true, message: 'Updated' })

    server.use(http.post('*/borrower/auth-profile/update-password', () => HttpResponse.json({ status: false, message: 'Current password is incorrect' })))
    await expect(updatePassword(payload)).rejects.toThrow('Current password is incorrect')
  })
})

describe('refreshUser', () => {
  it('unwraps data.data when present', async () => {
    server.use(http.get('*/common/refresh-user', () => HttpResponse.json({ status: true, data: { id: 1, name: 'Jane' } })))
    await expect(refreshUser()).resolves.toEqual({ id: 1, name: 'Jane' })
  })

  it('falls back to the raw response body when data.data is absent', async () => {
    server.use(http.get('*/common/refresh-user', () => HttpResponse.json({ status: true })))
    await expect(refreshUser()).resolves.toEqual({ status: true })
  })

  it('returns null instead of throwing on a network error', async () => {
    server.use(http.get('*/common/refresh-user', () => HttpResponse.error()))
    await expect(refreshUser()).resolves.toBeNull()
  })
})
