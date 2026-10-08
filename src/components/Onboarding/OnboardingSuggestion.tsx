import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth'
import { useOnboardingPopupStore } from '../../store/onboardingPopupStore'
import { queryKeys } from '../../lib/query'
import { ONBOARDING_MENU } from '../../config/onboardingSteps'
import { ONBOARDING_PATHS } from '../../config/onboardingSteps'
import type { OnboardingPathId, OnboardingStepConfig } from '../../config/onboardingSteps'
import {
  getStepShownThisSession,
  markStepShownThisSession,
  shouldAutoOpen,
  useOnboardingSuggestion,
} from '../../modules/onboarding'
import {
  useChooseOnboardingPath,
  useCompleteOnboarding,
  useResumeOnboardingStep,
  useSkipOnboardingStep,
} from '../../modules/profile'
import OnboardingModal from './OnboardingModal'
import ResultsChoiceModal from './ResultsChoiceModal'
import './Onboarding.css'

/** A step's page, without the query string ("/profile?tab=3" → "/profile"). */
const pageOf = (route: string) => route.split('?')[0]

const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * The borrower's "what to do next" suggestion, on every page: a Next step
 * button in the top bar, and a popup that opens by itself once per step per
 * login (and whenever the borrower moves on), or whenever the button is clicked.
 */
export default function OnboardingSuggestion() {
  const userId = useAuthStore((state) => state.user?.id)
  // Credit Card Stacking shows a locked screen until the credit profile is updated.
  const creditCardStackingOpen = useAuthStore((state) => !!state.user?.credit_profile_updated)
  const suggestion = useOnboardingSuggestion()
  const [open, setOpen] = useState(false)
  // Changing a path already chosen: the popup shows the choice again.
  const [changingPath, setChangingPath] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { mutate: completeOnboarding } = useCompleteOnboarding()
  const skipStep = useSkipOnboardingStep()
  const resumeStep = useResumeOnboardingStep()
  const choosePath = useChooseOnboardingPath()

  const stepId = suggestion?.step.id
  // Some steps already have a prompt of their own that opens by itself.
  const stepAutoOpens = suggestion?.step.autoOpen !== false
  // Another modal is open and already says what this one would (see the store).
  const held = useOnboardingPopupStore((state) => state.held)

  useEffect(() => {
    if (!stepId || userId == null) return

    const autoOpen = shouldAutoOpen({ seenThisSession: getStepShownThisSession(userId), current: stepId })
    markStepShownThisSession(userId, stepId)
    if (autoOpen && stepAutoOpens && !held) setOpen(true)
  }, [stepId, userId, stepAutoOpens, held])

  // Review is done by FCH, so look again for a new step on every page change
  // (the first page already fetched on mount).
  const firstPath = useRef(true)
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false
      return
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
  }, [pathname, queryClient])

  // Reaching the page of the path the borrower chose ends the walkthrough (for
  // Credit Card Stacking, not its locked screen). The free-trial journey ends
  // by itself with the credit profile.
  const reportedArrival = useRef(false)
  const chosenPath = suggestion?.pathChoice?.selected ?? null
  const atDestination =
    stepId === 'results_ready' &&
    chosenPath !== null &&
    pathname.startsWith(chosenPath.route) &&
    (chosenPath.route !== ONBOARDING_MENU.CREDIT_CARD_STACKING || creditCardStackingOpen)
  useEffect(() => {
    if (!atDestination || reportedArrival.current) return
    reportedArrival.current = true
    completeOnboarding(undefined, {
      onError: () => {
        reportedArrival.current = false
      },
    })
  }, [atDestination, completeOnboarding])

  // Opening a skipped step's page, from anywhere, is going back to it.
  const resumedOnPage = useRef<string | null>(null)
  const pendingHere = suggestion?.pendingSteps.find((s) => s.route && pageOf(s.route) === pathname)
  useEffect(() => {
    if (!pendingHere || resumedOnPage.current === pendingHere.id) return
    resumedOnPage.current = pendingHere.id
    // They chose to be here: no need for the popup to open again for it.
    if (userId != null) markStepShownThisSession(userId, pendingHere.id)
    resumeStep.mutate(pendingHere.id)
  }, [pendingHere, resumeStep, userId])

  if (!suggestion) return null

  const { step, stepNumber, totalSteps, completedSteps, pendingSteps, pathChoice } = suggestion
  const close = () => {
    setOpen(false)
    setChangingPath(false)
  }

  // Results ready and nothing chosen yet (or changing it): the popup is the choice.
  const showChoice = pathChoice !== null && (pathChoice.selected === null || changingPath)

  /** Saves what the borrower is looking for, then takes them to its page. */
  const choose = (pathId: OnboardingPathId) => {
    const path = ONBOARDING_PATHS.find((p) => p.id === pathId)
    if (!path) return
    choosePath.mutate(pathId, {
      onSuccess: () => {
        close()
        // The page can tell the walkthrough brought the borrower (see FundingArrivalNote).
        navigate(path.route, { state: { fromWalkthrough: true } })
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'We could not save your choice. Please try again.')
      },
    })
  }

  /**
   * Back to a skipped step from the popup: it becomes the current step and the
   * popup, already open, shows it with its own way forward.
   */
  const resume = (pending: OnboardingStepConfig) => {
    resumedOnPage.current = pending.id
    // The popup is showing it already; don't count it as a step to announce.
    if (userId != null) markStepShownThisSession(userId, pending.id)
    resumeStep.mutate(pending.id)
  }

  return (
    <>
      <button
        type="button"
        className="onb-indicator"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Next step: ${step.title} (step ${stepNumber} of ${totalSteps})`}
      >
        <span
          className="onb-ring"
          role="progressbar"
          aria-valuenow={completedSteps}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
        >
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle className="onb-ring-track" cx="22" cy="22" r={RING_RADIUS} />
            <circle
              className="onb-ring-fill"
              cx="22"
              cy="22"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - completedSteps / totalSteps)}
            />
          </svg>
          <span className="onb-ring-text">
            {stepNumber}/{totalSteps}
          </span>
        </span>
        <span className="onb-indicator-text">
          <span className="onb-indicator-label">
            Next step{pendingSteps.length > 0 && ` · ${pendingSteps.length} skipped to finish`}
          </span>
          <span className="onb-indicator-title">{step.title}</span>
        </span>
        <i className="ri-arrow-down-s-line onb-indicator-arrow" aria-hidden="true"></i>
      </button>

      {showChoice ? (
        <ResultsChoiceModal
          isOpen={open}
          onClose={close}
          onChoose={choose}
          selected={pathChoice?.selected?.id ?? null}
          choosing={choosePath.isPending}
        />
      ) : (
        <OnboardingModal
          isOpen={open}
          onClose={close}
          suggestion={suggestion}
          onSkip={() => skipStep.mutate(step.id)}
          skipping={skipStep.isPending}
          onResume={resume}
          resuming={resumeStep.isPending}
          onChangeChoice={pathChoice?.selected ? () => setChangingPath(true) : undefined}
        />
      )}
    </>
  )
}
