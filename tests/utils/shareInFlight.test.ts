import { describe, expect, it, vi } from 'vitest'
import { shareInFlight } from '../../src/utils/shareInFlight'

describe('shareInFlight', () => {
  it('gives callers that arrive while a call is running that same call', async () => {
    const fn = vi.fn(async () => 'done')
    const shared = shareInFlight(fn)

    const [a, b] = await Promise.all([shared(), shared()])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(a).toBe('done')
    expect(b).toBe('done')
  })

  it('starts a new call once the previous one has finished', async () => {
    const fn = vi.fn(async () => 'done')
    const shared = shareInFlight(fn)

    await shared()
    await shared()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('tries again after a call fails', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('done')
    const shared = shareInFlight(fn)

    await expect(shared()).rejects.toThrow('offline')
    await expect(shared()).resolves.toBe('done')
  })
})
