import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth'
import { useOnboardingPopupStore } from '../../store/onboardingPopupStore'
import { queryKeys } from '../../lib/query'
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
  const suggestion = useOnboardingSuggestion()
  const [open, setOpen] = useState(false)
  // The results window, once shown: it outlives the walkthrough it finishes.
  const [resultsOpen, setResultsOpen] = useState(false)
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
  // Another modal is open, or the page has a prompt of its own (see the store).
  const heldByModal = useOnboardingPopupStore((state) => state.held)
  const heldByPage = useOnboardingPopupStore((state) => state.pageHeld)
  const isResults = stepId === 'results_ready'
  // Nothing on a page says what the results window does, so only a modal keeps it back.
  const held = heldByModal || (heldByPage && !isResults)

  useEffect(() => {
    if (!stepId || userId == null) return
    // The results are shown once, so they wait for the other modal to let go
    // instead of counting as seen behind it.
    if (held && isResults) return

    const autoOpen = shouldAutoOpen({ seenThisSession: getStepShownThisSession(userId), current: stepId })
    markStepShownThisSession(userId, stepId)
    if (autoOpen && stepAutoOpens && !held) setOpen(true)
  }, [stepId, userId, stepAutoOpens, held, isResults])

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

  // The last step is the results window (results ready, documents in). It is
  // shown once: showing it finishes the walkthrough, and it stays open, with
  // the choice of where to go, until the borrower is done with it.
  const atResults = stepId === 'results_ready' && suggestion?.pathChoice != null
  useEffect(() => {
    if (open && atResults) setResultsOpen(true)
  }, [open, atResults])

  const reportedResults = useRef(false)
  useEffect(() => {
    if (!resultsOpen || reportedResults.current) return
    reportedResults.current = true
    completeOnboarding(undefined, {
      onError: () => {
        reportedResults.current = false
      },
    })
  }, [resultsOpen, completeOnboarding])

  // Kept from when it was shown: once finished, the suggestion is gone.
  const selectedPath = useRef<OnboardingPathId | null>(null)
  if (atResults) selectedPath.current = suggestion?.pathChoice?.selected?.id ?? null

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

  const closeResults = () => {
    setResultsOpen(false)
    setOpen(false)
  }

  /** Saves what the borrower is looking for, then takes them to its page. */
  const choose = (pathId: OnboardingPathId) => {
    const path = ONBOARDING_PATHS.find((p) => p.id === pathId)
    if (!path) return
    choosePath.mutate(pathId, {
      onSuccess: () => {
        closeResults()
        // The page can tell the walkthrough brought the borrower (see FundingArrivalNote).
        navigate(path.route, { state: { fromWalkthrough: true } })
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'We could not save your choice. Please try again.')
      },
    })
  }

  const results = (
    <ResultsChoiceModal
      isOpen={resultsOpen}
      onClose={closeResults}
      onChoose={choose}
      selected={selectedPath.current}
      choosing={choosePath.isPending}
    />
  )

  if (!suggestion && !resultsOpen) return null

  const close = () => setOpen(false)

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

  // Kept in one tree: once the results window finishes the walkthrough, the
  // suggestion (and the button) go, but the window keeps its place - in a
  // different spot React would close it and open it again.
  return (
    <>
      {suggestion && <Indicator suggestion={suggestion} open={open} onOpen={() => setOpen(true)} />}

      {atResults || resultsOpen ? (
        results
      ) : (
        suggestion && (
          <OnboardingModal
            isOpen={open}
            onClose={close}
            suggestion={suggestion}
            onSkip={() => skipStep.mutate(suggestion.step.id)}
            skipping={skipStep.isPending}
            onResume={resume}
            resuming={resumeStep.isPending}
          />
        )
      )}
    </>
  )
}

/** The Next step button in the top bar: the step, and how far along the borrower is. */
function Indicator({
  suggestion,
  open,
  onOpen,
}: {
  suggestion: NonNullable<ReturnType<typeof useOnboardingSuggestion>>
  open: boolean
  onOpen: () => void
}) {
  const { step, stepNumber, totalSteps, completedSteps, pendingSteps } = suggestion
  return (
    <button
      type="button"
      className="onb-indicator"
      onClick={onOpen}
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
  )
}

