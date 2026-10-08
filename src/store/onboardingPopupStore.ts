import { create } from 'zustand'

/**
 * Lets another modal keep the Getting Started popup from opening by itself on
 * top of it - e.g. the Tier 0 "submitted successfully" modal, whose submission
 * also moves the walkthrough on. While held, a new step is marked as seen
 * instead of popping up; the Next step button still opens it.
 */
interface OnboardingPopupState {
  held: boolean
  hold: () => void
  release: () => void
}

export const useOnboardingPopupStore = create<OnboardingPopupState>((set) => ({
  held: false,
  hold: () => set({ held: true }),
  release: () => set({ held: false }),
}))
