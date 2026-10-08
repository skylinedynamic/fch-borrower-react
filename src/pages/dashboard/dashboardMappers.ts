import { INVOICE_STATUS_TYPES } from '../../config/invoiceStatusOptions'
import { PARTNER_TYPES } from '../../config/partnerTypeOptions'
import type { Meeting } from '../../modules/dashboard/types'

/** Bootstrap contextual colour used for a status pill. */
export type StatusTone = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'secondary'

const FICO_MIN = 300
const FICO_MAX = 850

/** Headline figures: "$50K". */
export const formatThousands = (amount: number): string => `$${(amount / 1000).toFixed(0)}K`

/** Table amounts: "$25,000". */
export const formatUsd = (amount: number): string =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })

/** Invoice amounts, in the invoice's own currency symbol: "$1,250.00". */
export const formatInvoiceAmount = (amount: string | number | null | undefined, currencySymbol: string): string =>
  `${currencySymbol}${parseFloat(String(amount ?? 0) || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}`

export const toNumber = (value: string | number | null | undefined): number => parseFloat(String(value ?? 0)) || 0

export function invoiceStatusTone(status: string): StatusTone {
  if (status === INVOICE_STATUS_TYPES.PAID) return 'success'
  if (status === INVOICE_STATUS_TYPES.UNPAID || status === INVOICE_STATUS_TYPES.OVERDUE) return 'danger'
  if (status === INVOICE_STATUS_TYPES.PENDING) return 'warning'
  return 'info'
}

/**
 * Restricted borrowers, and every white-label or certified borrower, are asked
 * to pay as long as any invoice isn't paid.
 */
export function shouldShowPendingInvoiceAlert({
  isRestricted,
  partnerType,
  invoices,
}: {
  isRestricted: boolean
  partnerType: string | null | undefined
  invoices: { status?: string | null }[]
}): boolean {
  const type = String(partnerType || '').trim().toLowerCase()
  const isWhiteLabel = type.includes('white') || type === PARTNER_TYPES.WHITE_LABEL.toLowerCase()
  const isCertified = type.includes('certified') || type === PARTNER_TYPES.CERTIFIED.toLowerCase()

  return (isRestricted || isWhiteLabel || isCertified) && countPendingInvoices(invoices) > 0
}

export const countPendingInvoices = (invoices: { status?: string | null }[]): number =>
  invoices.filter((i) => String(i.status || '').trim().toLowerCase() !== INVOICE_STATUS_TYPES.PAID.toLowerCase()).length

export interface FicoDisplay {
  hasScore: boolean
  score: number | null
  /** Where the score sits on the 300-850 scale, 0 to 1, for the gauge. */
  fraction: number
}

export function toFicoDisplay(value: number | string | null | undefined): FicoDisplay {
  if (value === null || value === undefined || value === '') return { hasScore: false, score: null, fraction: 0 }

  const score = Number(value)
  const clamped = Math.min(Math.max(score, FICO_MIN), FICO_MAX)
  return { hasScore: true, score, fraction: (clamped - FICO_MIN) / (FICO_MAX - FICO_MIN) }
}

export interface MeetingView {
  id: number
  date: string
  day: string
  month: string
  time: string
  title: string
  type: string
}

export function toMeeting(meeting: Meeting): MeetingView {
  const date = new Date(meeting.appointment_date)
  return {
    id: meeting.id,
    date: date.getDate().toString(),
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    title: meeting.subject,
    type: meeting.meeting_type,
  }
}
