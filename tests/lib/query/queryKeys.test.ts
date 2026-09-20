import { describe, expect, it } from 'vitest'
import { queryKeys } from '../../../src/lib/query/queryKeys'

describe('queryKeys', () => {
  it('nests list/detail keys under each namespace\'s "all" key', () => {
    expect(queryKeys.borrower.list()).toEqual(['borrower', 'list'])
    expect(queryKeys.borrower.detail(42)).toEqual(['borrower', 'detail', 42])
    expect(queryKeys.borrower.detail('abc')).toEqual(['borrower', 'detail', 'abc'])
  })

  it('keeps role permission-cache keys distinct from each other', () => {
    expect(queryKeys.role.permissionsGrouped()).toEqual(['role', 'permissions', 'grouped'])
    expect(queryKeys.role.permissionsGroupedFresh()).toEqual(['role', 'permissions', 'grouped', 'edit'])
    expect(queryKeys.role.permissionsGrouped()).not.toEqual(queryKeys.role.permissionsGroupedFresh())
  })

  it('produces stable (referentially equal-by-value) keys across calls', () => {
    expect(queryKeys.capitalAccess.detail(7)).toEqual(queryKeys.capitalAccess.detail(7))
    expect(queryKeys.capitalAccess.detailStep('strategy-1', 'sequence-2')).toEqual([
      'capitalAccess',
      'detailStep',
      'strategy-1',
      'sequence-2',
    ])
  })

  it('scopes fundingApplication.documents by application id', () => {
    expect(queryKeys.fundingApplication.documents(1)).toEqual(['fundingApplication', 'documents', 1])
    expect(queryKeys.fundingApplication.documents(null)).toEqual(['fundingApplication', 'documents', null])
    expect(queryKeys.fundingApplication.documents(1)).not.toEqual(queryKeys.fundingApplication.documents(2))
  })

  it('every namespace exposes a distinct "all" root key', () => {
    const roots = Object.values(queryKeys).map((ns) => ns.all[0])
    expect(new Set(roots).size).toBe(roots.length)
  })
})
