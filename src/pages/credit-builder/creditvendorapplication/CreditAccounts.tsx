import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
  useApplyForCreditAccount,
  useCreditAccountFilters,
  useCreditAccounts,
  type CreditAccount,
} from '../../../modules/credit-accounts'
import { useCreditProgress } from '../../../modules/credit-builder/overview'
import { useAuthStore } from '../../../store/auth/authStore'
import { refreshUser as refreshUserService } from '../../../modules/auth-profile/services'
import {
  CREDIT_ACCOUNTS_MIN_TIER,
  CREDIT_ACCOUNT_ALL_CATEGORIES,
  CREDIT_ACCOUNT_ALL_ISSUERS,
  type CreditAccountStatus,
} from '../../../config/creditAccountStatusOptions'
import CreditAccountsHero from './components/CreditAccountsHero'
import CreditAccountsToolbar, { type CreditAccountsDraft } from './components/CreditAccountsToolbar'
import CreditAccountCard from './components/CreditAccountCard'
import CreditAccountsPagination from './components/CreditAccountsPagination'
import { CreditAccountsEmpty, CreditAccountsLocked, CreditAccountsSkeleton } from './components/CreditAccountsStates'
import './CreditAccounts.css'

const EMPTY_DRAFT: CreditAccountsDraft = {
  category: CREDIT_ACCOUNT_ALL_CATEGORIES,
  issuer: CREDIT_ACCOUNT_ALL_ISSUERS,
  q: '',
}

const EMPTY_APPLIED = { category: '', issuer: '', q: '' }

/**
 * Credit Builder › Credit Accounts: the vendors the borrower can apply to,
 * filtered by category, issuer and a search, with the status the borrower
 * tracks on each. Locked below Tier 2.
 */
export default function CreditAccounts() {
  const [draft, setDraft] = useState<CreditAccountsDraft>(EMPTY_DRAFT)
  const [applied, setApplied] = useState(EMPTY_APPLIED)
  const [page, setPage] = useState(1)

  const { user, setUserData } = useAuthStore()
  const isTierLocked = (user?.current_tier ?? 0) < CREDIT_ACCOUNTS_MIN_TIER

  // The tier may have changed since login; the lock follows the fresh one.
  useEffect(() => {
    const fetchFreshUser = async () => {
      const response = await refreshUserService()
      const freshUser = response?.user || response
      if (freshUser && typeof freshUser === 'object') {
        setUserData(freshUser)
      }
    }
    fetchFreshUser()
  }, [setUserData])

  const { data: filterOptions } = useCreditAccountFilters()
  // The tier's name, as the Overview shows it. user.current_tier is the tier's id.
  const { data: progress } = useCreditProgress()

  const categories = useMemo(() => [
    { id: CREDIT_ACCOUNT_ALL_CATEGORIES, name: CREDIT_ACCOUNT_ALL_CATEGORIES },
    ...(filterOptions?.data?.categories || []).map((c) => ({ id: c, name: c })),
  ], [filterOptions])

  const issuers = useMemo(() => [
    { id: CREDIT_ACCOUNT_ALL_ISSUERS, name: CREDIT_ACCOUNT_ALL_ISSUERS },
    ...(filterOptions?.data?.issuers || []).map((i) => ({ id: i, name: i })),
  ], [filterOptions])

  const { data: accountsData, isLoading } = useCreditAccounts(
    { ...applied, page },
    { enabled: !isTierLocked },
  )

  const applyFilters = () => {
    setPage(1)
    setApplied({
      category: draft.category === CREDIT_ACCOUNT_ALL_CATEGORIES ? '' : draft.category,
      issuer: draft.issuer === CREDIT_ACCOUNT_ALL_ISSUERS ? '' : draft.issuer,
      q: draft.q.trim(),
    })
  }

  const clearFilters = () => {
    setDraft(EMPTY_DRAFT)
    setPage(1)
    setApplied(EMPTY_APPLIED)
  }

  const markStatus = useApplyForCreditAccount()

  // Any status from any other - by design, BUG-028 (see StatusMenu).
  const handleMark = (id: number, status: CreditAccountStatus) => {
    markStatus.mutate({ id, status }, {
      onSuccess: (response) => toast.success(response?.message || 'Status updated successfully'),
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update status'),
    })
  }

  const accounts: CreditAccount[] = accountsData?.data || []
  const lastPage = accountsData?.meta?.last_page ?? 1
  const updatingId = markStatus.isPending ? markStatus.variables?.id : undefined

  const changePage = (next: number) => {
    setPage(next)
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-content ca-page">
      <div className="container-fluid">
        <CreditAccountsHero
          total={isTierLocked || isLoading ? undefined : accountsData?.meta?.total ?? accounts.length}
          tierName={progress?.name}
          locked={isTierLocked}
        />

        <CreditAccountsToolbar
          draft={draft}
          categories={categories}
          issuers={issuers}
          disabled={isTierLocked}
          onChange={setDraft}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {isTierLocked ? (
          <CreditAccountsLocked />
        ) : isLoading ? (
          <CreditAccountsSkeleton />
        ) : accounts.length ? (
          <>
            <div className="ca-grid">
              {accounts.map((account) => (
                <CreditAccountCard
                  key={account.id}
                  account={account}
                  updating={updatingId === account.id}
                  onMark={handleMark}
                />
              ))}
            </div>
            <CreditAccountsPagination page={page} lastPage={lastPage} onPage={changePage} />
          </>
        ) : (
          <CreditAccountsEmpty onClear={clearFilters} />
        )}
      </div>
    </div>
  )
}
