import { afterEach, describe, expect, it, vi } from 'vitest'

const loadStripeMock = vi.fn((key: string) => Promise.resolve({ key } as any))
vi.mock('@stripe/stripe-js/pure', () => ({
  loadStripe: (key: string) => loadStripeMock(key),
}))

describe('getStripe', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('loads Stripe once for a given publishable key', async () => {
    const { getStripe } = await import('../../src/lib/stripe')

    await getStripe('pk_test_123')
    await getStripe('pk_test_123')

    expect(loadStripeMock).toHaveBeenCalledTimes(1)
    expect(loadStripeMock).toHaveBeenCalledWith('pk_test_123')
  })

  it('reloads Stripe when the publishable key changes', async () => {
    const { getStripe } = await import('../../src/lib/stripe')

    await getStripe('pk_test_123')
    await getStripe('pk_test_456')

    expect(loadStripeMock).toHaveBeenCalledTimes(2)
    expect(loadStripeMock).toHaveBeenNthCalledWith(1, 'pk_test_123')
    expect(loadStripeMock).toHaveBeenNthCalledWith(2, 'pk_test_456')
  })

  it('returns the already-loaded promise when called again with no key', async () => {
    const { getStripe } = await import('../../src/lib/stripe')

    const first = await getStripe('pk_test_123')
    const second = await getStripe()

    expect(second).toEqual(first)
    expect(loadStripeMock).toHaveBeenCalledTimes(1)
  })

  it('warns and returns null when called with no key and nothing was ever loaded', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { getStripe } = await import('../../src/lib/stripe')

    const result = await getStripe()

    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Stripe publishable key was not provided to getStripe().')
  })
})
