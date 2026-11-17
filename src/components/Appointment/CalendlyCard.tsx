import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { queryKeys } from '../../lib/query'
import { connectCalendly, disconnectCalendly, syncCalendly } from '../../modules/calendly/services'
import type { CalendlyStatus } from '../../modules/calendly/types'
import ConfirmationModal from '../GlobalModal/ConfirmationModal'
import calendlyLogo from '../../../assets/images/integrations/calendly.svg'

type Props = {
  status?: CalendlyStatus
  /** Calendly meetings were brought in - reload the calendar. */
  onSynced: () => void
  /** Sends the browser to Calendly's sign-in (replaceable in tests). */
  redirect?: (url: string) => void
}

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

/**
 * The borrower's Calendly on the Appointments page - the same card as the
 * partner portal's. They connect their own Calendly here (Calendly's sign-in,
 * through their partner's Calendly app - nothing to type), sync it and
 * disconnect it. Until they do, they book with their partner's Calendly, which
 * they may sync too. Calendly sends the browser back here after sign-in.
 */
export default function CalendlyCard({ status, onSynced, redirect = (url) => window.location.assign(url) }: Props) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const refreshStatus = () => queryClient.invalidateQueries({ queryKey: queryKeys.calendly.all })
  // On the way to Calendly's sign-in: the button stays busy until the browser leaves.
  const [redirecting, setRedirecting] = useState(false)
  const [askDisconnect, setAskDisconnect] = useState(false)

  // Back from Calendly's sign-in: say how it went, then drop the flag from the URL.
  useEffect(() => {
    const result = searchParams.get('calendly')
    if (!result) return
    if (result === 'connected') {
      toast.success('Calendly connected')
      refreshStatus()
      onSynced()
    } else {
      toast.error('Calendly could not be connected')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('calendly')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const connect = useMutation({
    mutationFn: connectCalendly,
    onSuccess: (url) => {
      setRedirecting(true)
      redirect(url)
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not start connecting Calendly')),
  })

  const disconnect = useMutation({
    mutationFn: disconnectCalendly,
    onSuccess: () => {
      toast.success('Calendly disconnected')
      setAskDisconnect(false)
      refreshStatus()
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not disconnect Calendly')),
  })

  const sync = useMutation({
    mutationFn: syncCalendly,
    onSuccess: (count) => {
      toast.success(`${count} Calendly meeting(s) synced`)
      refreshStatus()
      onSynced()
    },
    onError: (error) => toast.error(errorMessage(error, 'Calendly sync failed')),
  })

  // Opening (or reloading) the page brings in meetings booked in Calendly
  // since the last sync - once, quietly, and only when there is one to sync.
  const autoSynced = useRef(false)
  const autoSync = useMutation({
    mutationFn: syncCalendly,
    onSuccess: () => {
      refreshStatus()
      onSynced()
    },
    onError: () => refreshStatus(),
  })

  // Their own Calendly is signed in.
  const connected = Boolean(status?.connected)
  const canManage = Boolean(status?.can_manage)
  const canSync = Boolean(status?.can_sync)
  const booksWithPartner = Boolean(status?.books_with_partner)
  const connecting = connect.isPending || redirecting

  useEffect(() => {
    if (canSync && !autoSynced.current) {
      autoSynced.current = true
      autoSync.mutate()
    }
  }, [canSync, autoSync])

  if (!status || (!canManage && !connected && !booksWithPartner)) {
    return null
  }

  return (
    <div className="card mb-3 calendly-card">
      <div className="card-body">
        <div className="d-flex align-items-center mb-2">
          <img src={calendlyLogo} alt="" width={20} height={20} className="me-2 flex-shrink-0" aria-hidden="true" />
          <h6 className="mb-0 flex-grow-1">Calendly</h6>
          {connected && <span className="badge bg-success-subtle text-success">Connected</span>}
          {!connected && status.needs_reconnect && <span className="badge bg-warning-subtle text-warning">Expired</span>}
        </div>

        {connected && (
          <p className="text-muted fs-12 mb-2">
            {status.name}
            {status.email ? ` · ${status.email}` : ''}
          </p>
        )}

        {connected && status.webhooks_active === false && (
          <p className="text-warning fs-12 mb-2">
            Webhooks are not active - new Calendly bookings appear after a sync (hourly, or Sync now).
          </p>
        )}

        {canSync && status.last_synced_at && (
          <p className="text-muted fs-12 mb-2">Last synced {new Date(status.last_synced_at).toLocaleString()}</p>
        )}

        {!connected && booksWithPartner && (
          <p className="text-muted fs-12 mb-2">
            You book with your advisor&apos;s Calendly{status.partner_name ? <> (<span className="fw-semibold">{status.partner_name}</span>)</> : null}.
            {' '}Connect your own to book meetings in your Calendly.
          </p>
        )}

        {!connected && canManage && (
          <button type="button" className="btn btn-primary w-100 mb-2" disabled={connecting} onClick={() => connect.mutate()}>
            {connecting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Connecting…
              </>
            ) : status.needs_reconnect ? 'Reconnect Calendly' : 'Connect Calendly'}
          </button>
        )}

        {(canSync || (connected && canManage)) && (
          <div className="d-flex gap-2">
            {canSync && (
              <button type="button" className="btn btn-soft-secondary btn-sm flex-grow-1" disabled={sync.isPending} onClick={() => sync.mutate()}>
                {sync.isPending || autoSync.isPending ? 'Syncing…' : 'Sync now'}
              </button>
            )}
            {connected && canManage && (
              <button type="button" className="btn btn-soft-danger btn-sm" disabled={disconnect.isPending} onClick={() => setAskDisconnect(true)}>
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        show={askDisconnect}
        onClose={() => setAskDisconnect(false)}
        onConfirm={() => disconnect.mutate()}
        loading={disconnect.isPending}
        title="Disconnect Calendly?"
        message="Your Calendly stops syncing, and new bookings go to your advisor's Calendly again. Meetings already brought in stay on your calendar."
        confirmText="Yes, disconnect"
        confirmBtnClass="btn-danger"
      />
    </div>
  )
}
