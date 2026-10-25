import { describe, expect, it } from 'vitest'
import { ficoBand, ficoRatio, readinessRatio } from '../../../src/pages/funding/fundingStats'

describe('fundingStats', () => {
  it('places the readiness score on a 0-100 meter', () => {
    expect(readinessRatio(76)).toBe(0.76)
    expect(readinessRatio('40')).toBe(0.4)
    expect(readinessRatio(140)).toBe(1)
    expect(readinessRatio('N/A')).toBe(0)
  })

  it('places a FICO score on the 300-850 range', () => {
    expect(ficoRatio(850)).toBe(1)
    expect(ficoRatio(300)).toBe(0)
    expect(ficoRatio(575)).toBe(0.5)
    expect(ficoRatio('N/A')).toBeNull()
  })

  it('names the FICO band', () => {
    expect(ficoBand(560)).toBe('Poor')
    expect(ficoBand(600)).toBe('Fair')
    expect(ficoBand(700)).toBe('Good')
    expect(ficoBand(760)).toBe('Very Good')
    expect(ficoBand('800')).toBe('Exceptional')
    expect(ficoBand('N/A')).toBeNull()
  })
})
