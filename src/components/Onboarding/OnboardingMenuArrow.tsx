import React from 'react'
import { useLocation } from 'react-router-dom'
import type { OnboardingMenuTarget } from '../../config/onboardingSteps'
import { useOnboardingSuggestion } from '../../modules/onboarding'
import './Onboarding.css'

export interface OnboardingMenuArrowState {
  target: OnboardingMenuTarget
  tag: string
}

/**
 * The menu item the walkthrough points at right now, and why. Null on steps
 * with nowhere to go, and once the borrower is on that page.
 */
export function useOnboardingMenuArrow(): OnboardingMenuArrowState | null {
  const suggestion = useOnboardingSuggestion()
  const { pathname } = useLocation()

  const menu = suggestion?.step.menu
  if (!menu || pathname.startsWith(menu.target)) return null
  return menu
}

/** A red arrow beside a menu item, pointing at it: "go here next". */
export default function OnboardingMenuArrow({ tag }: { tag: string }) {
  return (
    <span className="onb-menu-arrow" role="img" aria-label={`Go here next: ${tag}`} title={tag}>
      <svg viewBox="0 0 34 16" aria-hidden="true">
        <path d="M1 8 11 1v4.5h21v5H11V15Z" />
      </svg>
    </span>
  )
}
