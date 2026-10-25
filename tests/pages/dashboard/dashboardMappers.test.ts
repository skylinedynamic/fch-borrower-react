import { describe, expect, it } from 'vitest'
import {
  formatThousands,
  formatUsd,
  formatInvoiceAmount,
  invoiceStatusTone,
  shouldShowPendingInvoiceAlert,
  toFicoDisplay,
  toMeeting,
} from '../../../src/pages/dashboard/dashboardMappers'

describe('dashboard formatting', () => {
  it('abbreviates headline amounts to whole thousands', () => {
    expect(formatThousands(50000)).toBe('$50K')
    expect(formatThousands(1499)).toBe('$1K')
    expect(formatThousands(0)).toBe('$0K')
  })

  it('formats table amounts as whole US dollars', () => {
    expect(formatUsd(25000)).toBe('$25,000')
    expect(formatUsd(0)).toBe('$0')
  })

  it('formats invoice amounts in the invoice currency, to the cent', () => {
    expect(formatInvoiceAmount('1250', '$')).toBe('$1,250.00')
    expect(formatInvoiceAmount(null, '£')).toBe('£0.00')
  })
})

describe('invoiceStatusTone', () => {
  it.each([
    ['Paid', 'success'],
    ['Unpaid', 'danger'],
    ['Overdue', 'danger'],
    ['Pending', 'warning'],
    ['Something else', 'info'],
  ])('%s is %s', (status, tone) => {
    expect(invoiceStatusTone(status)).toBe(tone)
  })
})

describe('shouldShowPendingInvoiceAlert', () => {
  const pending = [{ status: 'Unpaid' }]

  it('shows for a restricted borrower with something to pay', () => {
    expect(shouldShowPendingInvoiceAlert({ isRestricted: true, partnerType: '', invoices: pending })).toBe(true)
  })

  it('shows for white-label and certified borrowers regardless of restriction', () => {
    expect(shouldShowPendingInvoiceAlert({ isRestricted: false, partnerType: 'White-Label Partner (WL)', invoices: pending })).toBe(true)
    expect(shouldShowPendingInvoiceAlert({ isRestricted: false, partnerType: 'Certified Partner', invoices: pending })).toBe(true)
  })

  it('does not show for an unrestricted direct borrower', () => {
    expect(shouldShowPendingInvoiceAlert({ isRestricted: false, partnerType: '', invoices: pending })).toBe(false)
  })

  it('does not show when every invoice is paid, whatever the case of the status', () => {
    expect(shouldShowPendingInvoiceAlert({ isRestricted: true, partnerType: '', invoices: [{ status: ' paid ' }] })).toBe(false)
  })
})

describe('toFicoDisplay', () => {
  it('has no score until there is one', () => {
    expect(toFicoDisplay(null)).toEqual({ hasScore: false, score: null, fraction: 0 })
    expect(toFicoDisplay('')).toEqual({ hasScore: false, score: null, fraction: 0 })
  })

  it('places the score on the 300-850 FICO scale', () => {
    expect(toFicoDisplay(300).fraction).toBe(0)
    expect(toFicoDisplay(575).fraction).toBeCloseTo(0.5)
    expect(toFicoDisplay('850')).toEqual({ hasScore: true, score: 850, fraction: 1 })
  })

  it('keeps the gauge on the scale for an out-of-range score, but shows the real number', () => {
    expect(toFicoDisplay(900)).toEqual({ hasScore: true, score: 900, fraction: 1 })
    expect(toFicoDisplay(250).fraction).toBe(0)
  })
})

describe('toMeeting', () => {
  it('splits the appointment time into day, weekday and time', () => {
    expect(
      toMeeting({ id: 1, subject: 'Review', meeting_type: 'Zoom', appointment_date: '2026-10-15T14:30:00' } as never)
    ).toEqual({ id: 1, date: '15', day: 'Thu', month: 'Oct', time: '2:30 PM', title: 'Review', type: 'Zoom' })
  })
})
