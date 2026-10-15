import { describe, expect, it } from 'vitest'
import { bankingGuidance } from '../../src/utils/bankingGuidance'

const failedDeposits = {
  label: 'Minimum Monthly Deposits',
  status: 'Failed',
  group: 'banking',
  message: 'Bank statements failed. Please upload proper bank statements.',
  action: { label: 'Upload Bank Statements', path: '/documents' },
}

// The API marks a failed bank-statement check with a message and an upload
// link; the Funding pages show it instead of only "Missing Info".
describe('bankingGuidance', () => {
  it('returns the message and upload link of a failed banking check', () => {
    expect(bankingGuidance([{ label: 'Personal Credit', status: 'Good' }, failedDeposits])).toEqual({
      message: failedDeposits.message,
      action: failedDeposits.action,
    })
  })

  it('returns one message when several banking checks fail', () => {
    const failedBalance = { ...failedDeposits, label: 'Minimum Average Daily Balance' }

    expect(bankingGuidance([failedDeposits, failedBalance])?.message).toBe(failedDeposits.message)
  })

  it('is null when no banking check failed', () => {
    expect(bankingGuidance([{ label: 'Minimum Monthly Deposits', status: 'Strong', group: 'banking' }])).toBeNull()
    expect(bankingGuidance([{ label: 'Personal Credit', status: 'Failed' }])).toBeNull()
    expect(bankingGuidance([])).toBeNull()
    expect(bankingGuidance(undefined)).toBeNull()
  })

  it('ignores a failed banking check that carries no message', () => {
    expect(bankingGuidance([{ ...failedDeposits, message: undefined }])).toBeNull()
  })
})

describe('bankingGuidance with a Banking Activity reason', () => {
  const missingStatements = {
    label: 'Banking Activity',
    status: 'Failed',
    group: 'banking',
    reason_code: 'not_uploaded',
    reason: 'No Business Bank Statements uploaded yet.',
    requirement: 'Upload your Business Bank Statements on the Documents page.',
    message: 'Bank statements missing. Please upload your business bank statements.',
    action: { label: 'Upload Bank Statements', path: '/documents' },
  }
  const failedDeposits = {
    label: 'Minimum Monthly Deposits',
    status: 'Failed',
    group: 'banking',
    message: 'Bank statements failed. Please upload proper bank statements.',
    action: { label: 'Upload Bank Statements', path: '/documents' },
  }

  // Missing statements explain the figure failures too, so their message wins.
  it('prefers the Banking Activity message over a figure failure', () => {
    expect(bankingGuidance([failedDeposits, missingStatements])?.message).toBe(missingStatements.message)
  })
})
