import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getEcho, userChannelName } from '../../lib/realtime/echo'
import { queryKeys } from '../../lib/query/queryKeys'
import { useAuthStore } from '../../store/auth'
import { addIncomingNotification, applyNotificationsRead, fromBroadcast } from './cache'
import type { AppNotification, NotificationBroadcast, NotificationsReadBroadcast } from './types'

const READ_EVENT = '.notification.read'

// Sent to the borrower when the host or a partner changes a funding request's
// status (Approved included). The approved banner and the sidebar badge read
// GET /borrower/active-funding-requests, cached for 5 minutes - so this push
// calls that endpoint straight away, otherwise the banner only showed after the
// cache expired or a hard reload.
const FUNDING_REQUEST_STATUS_CHANGED = 'borrower.funding_request.status_changed'

const refreshActiveFundingRequests = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.activeFundingRequests() })

/**
 * Subscribes the signed-in user's private channel to:
 * - new notifications (Laravel BroadcastNotificationCreated) -> cache + onNotification
 * - `notification.read` from the user's other tabs -> cache
 * and refetches everything after a reconnect, to catch what was missed.
 *
 * Mount it once (the header bell does). Returns whether the socket is up, so
 * callers can fall back to polling while it isn't.
 */
export function useNotificationStream(onNotification?: (notification: AppNotification) => void): { connected: boolean } {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const userId = useAuthStore((state) => state.user?.id)
  const [connected, setConnected] = useState(false)

  // Latest callback without resubscribing on every render.
  const onNotificationRef = useRef(onNotification)
  onNotificationRef.current = onNotification

  useEffect(() => {
    const echo = token && userId ? getEcho() : null
    if (!echo || !userId) {
      setConnected(false)
      return
    }

    const channelName = userChannelName(userId)
    const channel = echo.private(channelName)

    const handleNotification = (payload: NotificationBroadcast) => {
      const notification = fromBroadcast(payload)
      addIncomingNotification(queryClient, notification)
      if (notification.type === FUNDING_REQUEST_STATUS_CHANGED) {
        refreshActiveFundingRequests(queryClient)
      }
      onNotificationRef.current?.(notification)
    }
    const handleRead = (payload: NotificationsReadBroadcast) => {
      applyNotificationsRead(queryClient, payload.ids, payload.unread_count)
    }

    channel.notification(handleNotification)
    channel.listen(READ_EVENT, handleRead)

    const connection = (echo.connector as any)?.pusher?.connection
    let wasConnected = connection?.state === 'connected'
    // Whether the socket has been up at least once since this mounted: the
    // first connection on page load is not a reconnect.
    let hasConnectedBefore = wasConnected
    setConnected(wasConnected)

    const handleStateChange = ({ current }: { current: string }) => {
      const isConnected = current === 'connected'
      if (isConnected && !wasConnected) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
        if (hasConnectedBefore) {
          // Back after a drop: an approval may have been missed while offline.
          // Not on the first connect - the page has just loaded it.
          refreshActiveFundingRequests(queryClient)
        }
        hasConnectedBefore = true
      }
      wasConnected = isConnected
      setConnected(isConnected)
    }
    connection?.bind('state_change', handleStateChange)

    return () => {
      channel.stopListeningForNotification(handleNotification)
      channel.stopListening(READ_EVENT, handleRead)
      connection?.unbind('state_change', handleStateChange)
    }
  }, [token, userId, queryClient])

  return { connected }
}
