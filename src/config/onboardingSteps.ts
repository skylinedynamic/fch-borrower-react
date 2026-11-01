import type { OnboardingPathId, ProfileOnboardingStatus } from '../modules/profile/services'
import { REQUIRED_DOCUMENT_CATEGORIES } from './documents'

export type { OnboardingPathId } from '../modules/profile/services'

/**
 * Copy and links for the borrower's Getting Started suggestion. Two journeys,
 * chosen by the API (`onboarding.flow`), both starting with completing the
 * profile:
 *
 * - paid: complete profile → submit credit profile → Verify All on Tier 0 →
 *   upload documents → results ready: choose what to look at
 *   (ONBOARDING_PATHS) and open that page. The results show as soon as the
 *   borrower's part is done; FCH's verification of Tier 0 and the credit
 *   profile is not waited for. There is no review step.
 * - free_trial: complete profile → submit credit profile, and that's it. The
 *   walkthrough proper is for paid borrowers.
 *
 * Paying isn't a step: the pending-invoice banner prompts for it, and the API
 * reports no step on the paid journey until it is done. Once the borrower has
 * reached the page they chose, the API reports `completed` and there is
 * nothing more to suggest.
 *
 * Which step the borrower is on comes from the API (`onboarding.current_step`
 * on GET /borrower/profile/completion); this file only says what to show.
 */

/** Where the borrower lands straight after submitting their credit profile. */
export const AFTER_CREDIT_PROFILE_ROUTE = {
  /** Paid: on to Verify All, to complete Tier 0. */
  PAID: '/credit-builder/guide',
  /** Limited access (free trial): Funding, as Credit Builder is closed to them. */
  FREE_TRIAL: '/funding',
} as const

export type OnboardingStepId = NonNullable<ProfileOnboardingStatus['current_step']>

/** `action` steps need the borrower to do something; `wait` steps are on us. */
export type OnboardingStepKind = 'action' | 'wait'

/** One thing a step makes possible, shown as a card in the popup. */
export interface OnboardingStepUnlock {
  icon: string
  title: string
  text: string
}

/** Menu items the walkthrough's arrow can point at, by route. */
export const ONBOARDING_MENU = {
  PROFILE: '/profile',
  STEP_GUIDE: '/credit-builder/guide',
  CREDIT_CARD_STACKING: '/credit-card-stacking',
  DOCUMENTS: '/documents',
  FUNDING: '/funding',
  CREDIT_ACCOUNTS: '/credit-builder/credit-accounts',
  APPOINTMENT: '/appointment',
} as const

export type OnboardingFlow = 'paid' | 'free_trial'

/** The steps of each journey, in order. */
export const ONBOARDING_FLOWS: Record<OnboardingFlow, readonly OnboardingStepId[]> = {
  paid: ['complete_profile', 'credit_profile', 'verify_all', 'upload_documents', 'results_ready'],
  free_trial: ['complete_profile', 'credit_profile'],
}

/** The profile's required sections, by the Profile page tab that holds each. */
export const PROFILE_SECTIONS = [
  { key: 'personal', name: 'Personal Information', tab: 0 },
  { key: 'business', name: 'Business Details', tab: 1 },
  { key: 'financial', name: 'Financial', tab: 2 },
] as const

export type OnboardingMenuTarget = (typeof ONBOARDING_MENU)[keyof typeof ONBOARDING_MENU]

export interface OnboardingStepNotice {
  icon: string
  title: string
  text: string
}

export interface OnboardingStepConfig {
  id: OnboardingStepId
  kind: OnboardingStepKind
  /** Short name for the indicator. */
  label: string
  title: string
  description: string
  icon: string
  ctaLabel: string | null
  route: string | null
  /** Whether the borrower may skip it (the API enforces the same list). */
  skippable: boolean
  /**
   * False when another prompt already opens by itself for this step, so the
   * walkthrough popup waits to be asked (from the Next step button).
   */
  autoOpen?: boolean
  /** Where the menu arrow points, and the tag beside it. Null: no arrow. */
  menu: { target: OnboardingMenuTarget; tag: string } | null
  /**
   * Where things stand before this step, shown above it - e.g. that the
   * previous step is still being verified, while this one can go ahead.
   */
  notice?: OnboardingStepNotice | null
  /** Why the step matters, in a sentence. */
  why: string
  /** What the borrower does (or, on a wait step, what happens) in order. */
  todo: readonly string[]
  /** What finishing the step leads to. */
  unlocks: readonly OnboardingStepUnlock[]
}

export const ONBOARDING_STEPS: readonly OnboardingStepConfig[] = [
  {
    id: 'complete_profile',
    kind: 'action',
    label: 'Profile',
    title: 'Complete your profile',
    description:
      'Fill in every required field in Personal Information, Business Details and Financial. The rest of the portal builds on these details.',
    icon: 'ri-user-settings-line',
    ctaLabel: 'Complete profile',
    // Narrowed to the first section still to fill in, when known (see progress.ts).
    route: '/profile',
    skippable: false,
    // The Complete Your Profile popup already opens by itself for this.
    autoOpen: false,
    menu: { target: ONBOARDING_MENU.PROFILE, tag: 'Complete your profile' },
    why: 'Your personal, business and financial details are what we use to verify your business and match you to credit and funding.',
    todo: [
      'Open your profile',
      'Fill in the required fields in each section',
      'Save each section',
    ],
    unlocks: [
      { icon: 'ri-file-shield-2-line', title: 'Credit profile next', text: 'A soft credit check that never impacts your score.' },
      { icon: 'ri-apps-2-line', title: 'The full portal', text: 'Every feature opens once your profile is complete.' },
    ],
  },
  {
    id: 'credit_profile',
    kind: 'action',
    label: 'Credit profile',
    title: 'Submit your credit profile',
    description:
      'Fill in the credit profile form and submit it. This is a soft credit check and never impacts your credit score.',
    icon: 'ri-file-shield-2-line',
    ctaLabel: 'Fill Credit Profile',
    route: '/profile?tab=3',
    skippable: false,
    menu: { target: ONBOARDING_MENU.PROFILE, tag: 'Submit your credit profile' },
    why: 'Your credit profile lets us see where you stand today and which funding strategies you can qualify for.',
    todo: [
      'Open your profile and go to the Credit Profile tab',
      'Fill in every section of the form',
      'Submit it for review',
    ],
    unlocks: [
      { icon: 'ri-speed-up-line', title: 'Your readiness score', text: 'Your credit profile feeds the score that shows how ready your business is for funding.' },
      { icon: 'ri-bank-card-line', title: 'Credit Card Stacking', text: 'Opens once we have verified your credit profile, with card strategies matched to you.' },
    ],
  },
  {
    id: 'verify_all',
    kind: 'action',
    label: 'Verify All',
    title: 'Verify your Tier 0 tasks',
    description:
      'Go to Credit Builder → Step-By-Step Guide and click Verify All to send every Tier 0 task to our team in one go.',
    icon: 'ri-shield-check-line',
    ctaLabel: 'Open Step by Step Guide',
    route: '/credit-builder/guide',
    skippable: false,
    menu: { target: ONBOARDING_MENU.STEP_GUIDE, tag: 'Click Verify All' },
    why: 'Tier 0 covers the legal and structural essentials lenders check first. Without it your business is not credit-ready.',
    todo: [
      'Open Credit Builder → Step-By-Step Guide',
      'Click Verify All in the Tier 0 section',
      'Confirm the list of tasks to send them for verification',
    ],
    unlocks: [
      { icon: 'ri-bank-card-line', title: 'Credit Card Stacking', text: 'Opens once your Tier 0 tasks are verified, with card strategies matched to you.' },
      { icon: 'ri-store-2-line', title: 'Tier 1 vendors', text: 'Starter vendor accounts that report to the bureaus, once Tier 0 is verified.' },
    ],
  },
  {
    id: 'results_ready',
    kind: 'action',
    label: 'Results ready',
    title: 'Your results are ready',
    description:
      'Your credit profile, Tier 0 tasks and documents are in. See your results and choose where to start.',
    icon: 'ri-bank-card-line',
    ctaLabel: 'Open Credit Card Stacking',
    route: '/credit-card-stacking',
    skippable: false,
    menu: { target: ONBOARDING_MENU.CREDIT_CARD_STACKING, tag: 'Your results are ready' },
    why: 'With your business foundation in, you can start building credit the way lenders expect.',
    todo: [
      'Open Credit Card Stacking',
      'Check your readiness score',
      'Choose a strategy and follow its roadmap',
    ],
    unlocks: [
      { icon: 'ri-speed-up-line', title: 'Readiness score', text: 'See how ready your business is for funding.' },
      { icon: 'ri-bank-card-line', title: 'Credit Card Stacking', text: 'Structured card application sequences to maximise your credit access.' },
    ],
  },
  {
    id: 'upload_documents',
    kind: 'action',
    label: 'Documents',
    title: 'Upload your documents',
    description:
      'Go to Documents and upload your four required documents. Every other category is optional.',
    icon: 'ri-folder-upload-line',
    ctaLabel: 'Upload documents',
    route: '/documents',
    skippable: false,
    menu: { target: ONBOARDING_MENU.DOCUMENTS, tag: 'Upload your documents' },
    // Shown while Tier 0 is still being verified (see progress.ts).
    notice: {
      icon: 'ri-hourglass-2-line',
      title: 'Your Tier 0 tasks are being verified',
      text: 'Our team is reviewing them now. Once they are verified, Credit Card Stacking and Tier 1 vendors open up. You don\'t need to wait: upload your documents in the meantime.',
    },
    why: 'Lenders review your documents alongside your credit profile, so having them in early speeds up every funding request.',
    todo: [
      'Open Documents',
      `Upload a file in each required category: ${REQUIRED_DOCUMENT_CATEGORIES.join(', ')}`,
      'Every other category is optional: add those files if you have them',
    ],
    unlocks: [
      { icon: 'ri-funds-line', title: 'Faster funding requests', text: 'Lenders review your documents with every funding request, so yours are ready to go.' },
      { icon: 'ri-shield-check-line', title: 'Kept secure', text: 'Only you and the administrative team can see your documents.' },
    ],
  },
]

/**
 * The credit profile step's copy on the free-trial journey: it is the last
 * step there, with no documents or Tier 0 after it.
 */
export const FREE_TRIAL_CREDIT_PROFILE_COPY: Pick<OnboardingStepConfig, 'why' | 'unlocks'> = {
  why: 'Your credit profile lets us see where you stand today and what your business can qualify for.',
  unlocks: [
    { icon: 'ri-speed-up-line', title: 'Your readiness score', text: 'Your credit profile feeds the score that shows how ready your business is for funding.' },
    { icon: 'ri-flag-2-line', title: 'Your setup is done', text: 'That completes your Getting Started steps.' },
  ],
}

/** One answer to "What are you looking for?" once the results are ready. */
export interface OnboardingPathConfig {
  id: OnboardingPathId
  title: string
  description: string
  /** The page it leads to, by its name in the menu. */
  destination: string
  route: OnboardingMenuTarget
  /**
   * Tagged "Recommended first". Fixed for now: the API doesn't yet say which
   * path its Funding Sequencing would put first.
   */
  recommended?: boolean
  /** A fixed line under the description, for a path with nothing to count. */
  note?: string
  /** What the borrower does on the page, once they have chosen it. */
  todo: readonly string[]
}

/**
 * The choices offered once the credit profile, Tier 0 and documents are in, in
 * the order shown. The ids are the API's (OnboardingStepService::PATHS).
 */
export const ONBOARDING_PATHS: readonly OnboardingPathConfig[] = [
  {
    id: 'card_stacking',
    title: 'Business credit card stacking',
    description: 'Several business cards opened in a planned sequence to build a larger combined credit line.',
    destination: 'Credit Card Stacking',
    route: ONBOARDING_MENU.CREDIT_CARD_STACKING,
    recommended: true,
    todo: ['Open Credit Card Stacking', 'Check your readiness score', 'Choose a strategy and follow its roadmap'],
  },
  {
    id: 'single_card',
    title: 'A single business credit card',
    description: 'One card matched to your credit profile. A simpler start if you need a line for everyday spend.',
    destination: 'Credit Accounts',
    route: ONBOARDING_MENU.CREDIT_ACCOUNTS,
    note: 'Matched to your credit profile',
    todo: ['Open Credit Builder, then Credit Accounts', 'Look through the cards matched to your profile', 'Apply for the one that fits'],
  },
  {
    id: 'funding',
    title: 'Loans & other financing',
    description: 'Term loans, lines of credit, equipment, transportation, revenue-based and real estate programs.',
    destination: 'Funding',
    route: ONBOARDING_MENU.FUNDING,
    todo: ['Open Funding', 'Look through the likely eligible programs first', 'Choose one and submit a funding request'],
  },
  {
    id: 'advisor',
    title: 'Not sure? Talk to an advisor',
    description: 'Review your results with an FCH advisor and choose the right order of steps.',
    destination: 'Appointment',
    route: ONBOARDING_MENU.APPOINTMENT,
    note: '30-minute strategy session',
    todo: ['Open Appointment', 'Pick a time that suits you', 'Book your 30-minute strategy session'],
  },
]

/** Required wherever an estimate is shown: these figures are not offers. */
export const RESULTS_ESTIMATE_DISCLAIMER =
  'Estimates are based on your credit profile and business information. They are not offers or approvals. Final terms and approval are set by each funding provider.'

/**
 * The last step's copy once the borrower has chosen a path: it points to the
 * page they chose instead of Credit Card Stacking.
 */
export const chosenPathCopy = (
  path: OnboardingPathConfig
): Pick<OnboardingStepConfig, 'title' | 'description' | 'ctaLabel' | 'route' | 'menu' | 'why' | 'todo' | 'unlocks'> => ({
  title: `Go to ${path.destination}`,
  description: `Your choice: ${path.title}. Open ${path.destination} to take the next step.`,
  ctaLabel: `Go to ${path.destination}`,
  route: path.route,
  menu: { target: path.route, tag: `Go to ${path.destination}` },
  why: 'Your business foundation and credit profile are in, so you can start where it suits you. You can change your choice at any time.',
  todo: path.todo,
  unlocks: [
    { icon: 'ri-route-line', title: 'Your choice, kept', text: 'We point you back here each time until you get started.' },
    { icon: 'ri-exchange-line', title: 'Change your mind', text: 'Pick a different path from this window whenever you like.' },
  ],
})
