import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchCreditProgress, fetchTaskOverview } from '../../../src/modules/credit-builder/overview/services'
import { fetchTierTaskList, verifyTierTasks } from '../../../src/modules/credit-builder/guide/services'

afterEach(() => server.resetHandlers())

describe('credit-builder overview services', () => {
  it('fetchCreditProgress unwraps the response data', async () => {
    server.use(
      http.get('*/borrower/credit-builder/my-progress', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { current_tier: 2, progress_percent: 40 } })
      )
    )
    await expect(fetchCreditProgress()).resolves.toEqual({ current_tier: 2, progress_percent: 40 })
  })

  it('fetchTaskOverview unwraps the response data', async () => {
    server.use(
      http.get('*/borrower/credit-builder/task-overview', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { completed: 3, total: 10 } })
      )
    )
    await expect(fetchTaskOverview()).resolves.toEqual({ completed: 3, total: 10 })
  })
})

describe('credit-builder guide services', () => {
  it('fetchTierTaskList returns the full envelope (not just .data)', async () => {
    const envelope = { status: true, message: 'ok', data: { tiers: [] } }
    server.use(http.get('*/borrower/credit-builder/tier-wise-tasklist', () => HttpResponse.json(envelope)))
    await expect(fetchTierTaskList()).resolves.toEqual(envelope)
  })

  it('verifyTierTasks posts the task verification payload', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/credit-builder/task-verify-request', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Verified' })
      })
    )

    await verifyTierTasks({ task_id: 5 } as any)
    expect(receivedBody).toEqual({ task_id: 5 })
  })
})
