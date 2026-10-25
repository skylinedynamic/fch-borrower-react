import { create } from 'zustand'

/**
 * Keeps the Getting Started popup from opening by itself, two ways:
 *
 * - `held`: another modal is open - e.g. the Tier 0 "submitted successfully"
 *   modal, whose submission also moves the walkthrough on. Nothing opens over
 *   it; the results window waits until it is let go.
 * - `pageHeld`: the page has a prompt of its own that already says what the
 *   step would (Documents and its "upload every document" prompt). Steps are
 *   kept back, but the results window still opens: nothing on the page says it.
 *
 * A step kept back is marked as seen instead of popping up; the Next step
 * button still opens it.
 */
interface OnboardingPopupState {
  held: boolean
  hold: () => void
  release: () => void
  pageHeld: boolean
  holdPage: () => void
  releasePage: () => void
}

export const useOnboardingPopupStore = create<OnboardingPopupState>((set) => ({
  held: false,
  hold: () => set({ held: true }),
  release: () => set({ held: false }),
  pageHeld: false,
  holdPage: () => set({ pageHeld: true }),
  releasePage: () => set({ pageHeld: false }),
}))
