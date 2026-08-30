/**
 * useDelayCountdown — shared hook for the Next Play Delay countdown.
 *
 * Returns the formatted remaining time string and raw days count
 * until the recommended play's cooling period expires.
 * Updates every 10 seconds automatically.
 *
 * @param unlockAtStr  ISO-8601 string from the API's unlock_at field (or null/undefined)
 * @returns  { text, days } | null — null means no active delay
 */

import { useState, useEffect } from 'react';

export interface DelayTimeRemaining {
  /** Human-readable countdown, e.g. "3d 4h 12m" */
  text: string;
  /** Full days remaining */
  days: number;
}

export function useDelayCountdown(
  unlockAtStr: string | null | undefined
): DelayTimeRemaining | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  return getDelayTimeRemaining(unlockAtStr, now);
}

/**
 * Pure function — safe to call outside a component (e.g. in tests).
 */
export function getDelayTimeRemaining(
  unlockAtStr: string | null | undefined,
  now: Date
): DelayTimeRemaining | null {
  if (!unlockAtStr) return null;

  const unlockDate = new Date(unlockAtStr);
  if (isNaN(unlockDate.getTime())) return null;

  const diffMs = unlockDate.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let text: string;
  if (days > 0) {
    text = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${minutes}m`;
  }

  return { text, days };
}
