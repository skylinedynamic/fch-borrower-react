import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import {
  fetchCapitalAccessOverview,
  fetchCapitalAccessStrategies,
  fetchCapitalAccessStrategyDetail,
  fetchCapitalAccessStrategyRoadmap,
} from '../../../src/modules/capital-access/services'

afterEach(() => server.resetHandlers())

describe('fetchCapitalAccessOverview', () => {
  it('returns the overview payload as-is', async () => {
    const overview = {
      readiness_score: 72,
      readiness_status: 'Good',
      factors: [],
      estimated_total_access: '$50,000.00',
      estimated_total_access_compact: '$50K',
    }
    server.use(
      http.get('*/borrower/capital-access/overview', () =>
        HttpResponse.json({ status: true, message: 'ok', data: overview })
      )
    )

    await expect(fetchCapitalAccessOverview()).resolves.toEqual(overview)
  })
})

describe('fetchCapitalAccessStrategies / fetchCapitalAccessStrategyDetail (checklist mapping)', () => {
  it('normalizes string checklist items into {id, label, complete: true}', async () => {
    server.use(
      http.get('*/borrower/capital-access/strategies-list', () =>
        HttpResponse.json({
          status: true,
          message: 'ok',
          data: [{ id: 1, name: 'Play A', checklist: ['Verify identity', 'Upload documents'] }],
        })
      )
    )

    const [strategy] = await fetchCapitalAccessStrategies()
    expect(strategy.checklist).toEqual([
      { id: 'item-0', label: 'Verify identity', complete: true },
      { id: 'item-1', label: 'Upload documents', complete: true },
    ])
  })

  it('normalizes object checklist items, defaulting complete to true unless explicitly false', async () => {
    server.use(
      http.get('*/borrower/capital-access/strategies/1', () =>
        HttpResponse.json({
          status: true,
          message: 'ok',
          data: {
            id: 1,
            name: 'Play A',
            checklist: [
              { id: 'a', label: 'Step A', complete: false },
              { name: 'Step B (no explicit id/complete)' },
            ],
          },
        })
      )
    )

    const strategy = await fetchCapitalAccessStrategyDetail(1)
    expect(strategy.checklist).toEqual([
      { id: 'a', label: 'Step A', complete: false },
      { id: 'item-1', label: 'Step B (no explicit id/complete)', complete: true },
    ])
  })

  it('defaults checklist/roadmap to an empty array when the backend omits them', async () => {
    server.use(
      http.get('*/borrower/capital-access/strategies/2', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { id: 2, name: 'Play B' } })
      )
    )

    const strategy = await fetchCapitalAccessStrategyDetail(2)
    expect(strategy.checklist).toEqual([])
    expect(strategy.roadmap).toEqual([])
  })
})

describe('fetchCapitalAccessStrategyRoadmap', () => {
  it('sends X-Skip-Toast so a locked/inaccessible roadmap does not toast an error', async () => {
    let receivedHeader: string | null = null
    server.use(
      http.get('*/borrower/capital-access/strategies/3/roadmap', ({ request }) => {
        receivedHeader = request.headers.get('X-Skip-Toast')
        return HttpResponse.json({ status: true, message: 'ok', data: { id: 3, name: 'Play C' } })
      })
    )

    await fetchCapitalAccessStrategyRoadmap(3)
    expect(receivedHeader).toBe('true')
  })

  it('defaults roadmap to [] and coerces missing string fields to empty strings', async () => {
    server.use(
      http.get('*/borrower/capital-access/strategies/3/roadmap', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { id: 3, name: 'Play C', roadmap: 'not-an-array' } })
      )
    )

    const roadmap = await fetchCapitalAccessStrategyRoadmap(3)
    expect(roadmap.roadmap).toEqual([])
    expect(roadmap.target_exposure).toBe('')
    expect(roadmap.est_timeline).toBe('')
    expect(roadmap.reason_code).toBeNull()
  })
})
