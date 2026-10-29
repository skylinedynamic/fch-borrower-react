import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Link, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { act, renderWithProviders, screen, waitFor, within } from '../../test-utils'
import {
  mockChoosePath,
  mockCompleteOnboarding,
  mockOnboardingStep,
  mockResultsFigures,
  mockResumeOnboarding,
  signInBorrower,
  signOutBorrower,
} from '../../mocks/onboarding'
import { queryKeys } from '../../../src/lib/query'
import OnboardingSuggestion from '../../../src/components/Onboarding/OnboardingSuggestion'
import { useOnboardingPopupStore } from '../../../src/store/onboardingPopupStore'

function Page({ name }: { name: string }) {
  return (
    <div>
      {name}
      <Link to="/documents">Documents</Link>
    </div>
  )
}

function renderSuggestion(route = '/') {
  return renderWithProviders(
    <>
      <OnboardingSuggestion />
      <Routes>
        <Route path="/" element={<Page name="Dashboard page" />} />
        <Route path="/documents" element={<Page name="Documents page" />} />
        <Route path="/profile" element={<Page name="Profile page" />} />
        <Route path="/credit-card-stacking" element={<Page name="Credit Card Stacking page" />} />
        <Route path="/credit-builder/guide" element={<Page name="Guide page" />} />
        <Route path="/funding" element={<Page name="Funding page" />} />
        <Route path="/appointment" element={<Page name="Appointment page" />} />
        <Route path="/credit-builder/credit-accounts" element={<Page name="Credit Accounts page" />} />
      </Routes>
    </>,
    { route }
  )
}

const indicator = () => screen.findByRole('button', { name: /next step/i })

beforeEach(() => {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // not available
  }
})
afterEach(signOutBorrower)

describe('OnboardingSuggestion', () => {
  it('renders nothing and asks nothing when nobody is signed in', () => {
    // Any request would hit an unhandled MSW route and error.
    signOutBorrower()
    const { container } = renderSuggestion()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('.onb-indicator')).toBeNull()
  })

  it('opens by itself with the next step and a button that goes there', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('credit_profile')
    renderSuggestion()

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/step 2 of 5/i)
    expect(dialog).toHaveTextContent(/submit your credit profile/i)
    // No payment or profile step in the walkthrough.
    expect(dialog).not.toHaveTextContent(/enrollment invoice|complete your profile/i)

    await user.click(screen.getByRole('link', { name: /fill credit profile/i }))

    expect(await screen.findByText('Profile page')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('explains why the step matters, what to do and what it unlocks', async () => {
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderSuggestion()

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: /what you.ll do/i })).toBeInTheDocument()
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3)
    expect(within(dialog).getByRole('heading', { name: /what this unlocks/i })).toBeInTheDocument()
    expect(dialog).toHaveTextContent(/verify all/i)
    expect(dialog).toHaveTextContent(/credit card stacking/i)
  })

  it('sends the borrower to Verify All straight after the credit profile', async () => {
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderSuggestion()

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/step 3 of 5/i)
    expect(dialog).toHaveTextContent(/verify your tier 0 tasks/i)
    expect(within(dialog).getByRole('link', { name: /open step by step guide/i })).toHaveAttribute(
      'href',
      '/credit-builder/guide'
    )
  })

  it('shows on the indicator which step the borrower is on', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('upload_documents')
    renderSuggestion()

    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: /later/i }))

    const indicator = await screen.findByRole('button', { name: /next step/i })
    // A progress ring reading "4/5", then what to do.
    expect(indicator).toHaveTextContent('4/5')
    expect(indicator).toHaveTextContent(/documents/i)
    expect(within(indicator).getByRole('progressbar', { hidden: true })).toHaveAttribute('aria-valuenow', '3')
  })

  it('closes on "Later" and can be reopened from the indicator', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderSuggestion()

    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: /later/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await user.click(await indicator())

    expect(await screen.findByRole('dialog')).toHaveTextContent(/verify your tier 0 tasks/i)
  })

  it('does not open by itself twice for the same step in one session', async () => {
    signInBorrower()
    mockOnboardingStep('verify_all')
    const { unmount } = renderSuggestion()
    await screen.findByRole('dialog')
    unmount()

    mockOnboardingStep('verify_all')
    renderSuggestion()

    expect(await indicator()).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens again as soon as the borrower reaches a new step', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('credit_profile')
    const { queryClient } = renderSuggestion()
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: /later/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    // The borrower submits the credit profile form.
    mockOnboardingStep('verify_all')
    await act(() => queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() }))

    expect(await screen.findByRole('dialog')).toHaveTextContent(/verify your tier 0 tasks/i)
  })

  it('checks for a new step whenever the borrower moves to another page', async () => {
    // Verification is done by FCH, not by anything the borrower does in this tab.
    const user = userEvent.setup()
    signInBorrower()
    const calls = mockOnboardingStep('upload_documents')
    renderSuggestion()
    await screen.findByRole('dialog')
    const before = calls.count

    await user.click(screen.getByRole('button', { name: /later/i }))
    await user.click(screen.getByRole('link', { name: 'Documents' }))

    await waitFor(() => expect(calls.count).toBeGreaterThan(before))
  })

  it('stays out of the way until the borrower has paid and completed their profile', async () => {
    // The pending-invoice banner and the Complete Your Profile modal cover those.
    signInBorrower()
    const calls = mockOnboardingStep(null)
    const { container } = renderSuggestion()

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('.onb-indicator')).toBeNull()
  })

  describe('when the results are ready', () => {
    // The last step: Tier 0 and the credit profile are verified and every
    // document is in. The results window shows once, and showing it finishes
    // the walkthrough; the borrower can still choose a path from it.
    const choice = () => screen.findByRole('dialog', { name: /in capital access|your results are ready/i })
    const pathButton = (name: RegExp) => screen.getByRole('button', { name })

    it('asks what the borrower is looking for, with four paths to choose from', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures({ estimatedTotalAccess: '$815,000' })
      mockCompleteOnboarding()
      renderSuggestion()

      const dialog = await choice()
      expect(dialog).toHaveTextContent(/what are you looking for/i)
      expect(within(dialog).getByRole('button', { name: /business credit card stacking/i })).toHaveTextContent(/recommended first/i)
      expect(within(dialog).getByRole('button', { name: /a single business credit card/i })).toHaveTextContent(/go to credit accounts/i)
      expect(within(dialog).getByRole('button', { name: /loans & other financing/i })).toHaveTextContent(/go to funding/i)
      expect(within(dialog).getByRole('button', { name: /talk to an advisor/i })).toHaveTextContent(/go to appointment/i)
      // Required wherever an estimate is shown: these are not offers.
      expect(dialog).toHaveTextContent(/not offers or approvals/i)
    })

    it('says what the borrower has sent in, not that it is verified', async () => {
      // It shows once their part is done; our team may still be verifying.
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      mockCompleteOnboarding()
      renderSuggestion()

      const dialog = await choice()
      expect(dialog).toHaveTextContent(/your credit profile, tier 0 tasks and documents are in/i)
      expect(dialog).not.toHaveTextContent(/verified/i)
    })

    it('leads with the estimated capital access from the results', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures({ estimatedTotalAccess: '$815,000' })
      mockCompleteOnboarding()
      renderSuggestion()

      expect(
        await screen.findByRole('heading', { name: /we identified an estimated \$815,000 in capital access for your business/i })
      ).toBeInTheDocument()
    })

    it('does not name a figure it does not have', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      mockCompleteOnboarding()
      renderSuggestion()

      const dialog = await choice()
      expect(within(dialog).getByRole('heading', { level: 5 })).toHaveTextContent(/your results are ready/i)
      expect(dialog).not.toHaveTextContent(/\$\d/)
    })

    it('counts the eligible card strategies and funding programs, and invents no count', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures({
        estimatedTotalAccess: '$815,000',
        strategies: [{ approval_status: true }, { approval_status: true }, { approval_status: false }, { approval_status: true, isCompleted: true }],
        fundingStatuses: ['Active', 'Active', 'Active', 'Locked', 'Greyed Out'],
      })
      mockCompleteOnboarding()
      renderSuggestion()

      await choice()
      await waitFor(() => expect(pathButton(/card stacking/i)).toHaveTextContent(/2 eligible card strategies/i))
      await waitFor(() => expect(pathButton(/loans/i)).toHaveTextContent(/3 likely-eligible programs/i))
      expect(pathButton(/talk to an advisor/i)).toHaveTextContent(/30-minute strategy session/i)
      expect(pathButton(/single business credit card/i)).not.toHaveTextContent(/\d/)
    })

    it('finishes the walkthrough as soon as it is shown, and stays open for the choice', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      const completed = mockCompleteOnboarding()
      const { container } = renderSuggestion()

      const shown = await choice()
      await waitFor(() => expect(completed.count).toBe(1))
      // The walkthrough is over, so the Next step button goes...
      await waitFor(() => expect(container.querySelector('.onb-indicator')).toBeNull())
      // ...but the results stay up until the borrower is done with them: the
      // same window, not closed and opened again.
      expect(await choice()).toBe(shown)
      expect(shown).toHaveTextContent(/what are you looking for/i)
      expect(completed.count).toBe(1)
    })

    it('saves the choice and takes the borrower there', async () => {
      const user = userEvent.setup()
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      const chosen = mockChoosePath()
      mockCompleteOnboarding()
      renderSuggestion()

      await choice()
      await user.click(pathButton(/loans & other financing/i))

      expect(await screen.findByText('Funding page')).toBeInTheDocument()
      expect(chosen).toEqual(['funding'])
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('sends a single-card choice to Credit Builder, Credit Accounts', async () => {
      const user = userEvent.setup()
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      mockChoosePath()
      mockCompleteOnboarding()
      renderSuggestion()

      await choice()
      await user.click(pathButton(/a single business credit card/i))

      expect(await screen.findByText('Credit Accounts page')).toBeInTheDocument()
    })

    it('closes on "Decide later", and does not come back: the walkthrough is finished', async () => {
      const user = userEvent.setup()
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      const chosen = mockChoosePath()
      const completed = mockCompleteOnboarding()
      const { container } = renderSuggestion()

      await choice()
      await waitFor(() => expect(completed.count).toBe(1))
      await user.click(screen.getByRole('button', { name: /decide later/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(chosen).toEqual([])
      expect(container.querySelector('.onb-indicator')).toBeNull()
    })

    it('marks the path chosen before', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready', { selected_path: 'advisor' } as never)
      mockResultsFigures()
      mockCompleteOnboarding()
      renderSuggestion()

      await choice()
      expect(pathButton(/talk to an advisor/i)).toHaveAttribute('aria-pressed', 'true')
      expect(pathButton(/card stacking/i)).toHaveAttribute('aria-pressed', 'false')
    })

    it('does not finish while another modal holds it back', async () => {
      useOnboardingPopupStore.getState().hold()
      signInBorrower()
      const step = mockOnboardingStep('results_ready')
      const completed = mockCompleteOnboarding()
      renderSuggestion()

      await waitFor(() => expect(step.count).toBeGreaterThan(0))
      await act(() => new Promise((r) => setTimeout(r, 50)))

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(completed.count).toBe(0)
      useOnboardingPopupStore.getState().release()
    })

    it('opens straight away on a page that only holds back the other steps', async () => {
      // Documents has its own prompt, so it holds the walkthrough popup - but
      // uploading the last document there should bring the results at once.
      useOnboardingPopupStore.getState().holdPage()
      signInBorrower()
      mockOnboardingStep('results_ready')
      mockResultsFigures()
      const completed = mockCompleteOnboarding()
      renderSuggestion()

      expect(await choice()).toHaveTextContent(/what are you looking for/i)
      await waitFor(() => expect(completed.count).toBe(1))
      useOnboardingPopupStore.getState().releasePage()
    })

    it('still keeps other steps back on such a page', async () => {
      useOnboardingPopupStore.getState().holdPage()
      signInBorrower()
      const step = mockOnboardingStep('upload_documents')
      renderSuggestion()

      await waitFor(() => expect(step.count).toBeGreaterThan(0))
      await act(() => new Promise((r) => setTimeout(r, 50)))
      expect(screen.queryByRole('dialog')).toBeNull()
      useOnboardingPopupStore.getState().releasePage()
    })

    it('opens as soon as the other modal lets go, so it is never missed', async () => {
      // E.g. the last document went in on the Documents page, which holds popups.
      useOnboardingPopupStore.getState().hold()
      signInBorrower()
      const step = mockOnboardingStep('results_ready')
      mockResultsFigures()
      const completed = mockCompleteOnboarding()
      renderSuggestion()

      await waitFor(() => expect(step.count).toBeGreaterThan(0))
      await act(() => new Promise((r) => setTimeout(r, 50)))
      expect(screen.queryByRole('dialog')).toBeNull()

      act(() => useOnboardingPopupStore.getState().release())

      expect(await choice()).toHaveTextContent(/what are you looking for/i)
      await waitFor(() => expect(completed.count).toBe(1))
    })
  })

  describe('skipping a step', () => {
    // Every paid borrower has to get through Tier 0: nothing can be skipped.
    it.each(['credit_profile', 'upload_documents', 'verify_all', 'results_ready'] as const)(
      'cannot skip the %s step',
      async (step) => {
        signInBorrower()
        mockOnboardingStep(step)
        renderSuggestion()

        expect(within(await screen.findByRole('dialog')).queryByRole('button', { name: /skip/i })).toBeNull()
      }
    )

    // Skips saved before skipping was turned off are no longer reported by the
    // API, but the portal still shows whatever `pending_steps` it is given.
    it('keeps a skipped step on the to-do list, with a way back to it', async () => {
      const user = userEvent.setup()
      signInBorrower()
      mockOnboardingStep('upload_documents', { completed_steps: 1, pending_steps: ['verify_all'] })
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      const stillToDo = within(dialog).getByRole('region', { name: /skipped: still to do/i })
      expect(stillToDo).toHaveTextContent(/verify your tier 0 tasks/i)
      expect(within(stillToDo).getByRole('button', { name: /go to this step: verify your tier 0 tasks/i })).toBeInTheDocument()

      await user.click(within(dialog).getByRole('button', { name: /later/i }))
      // The indicator says something is still outstanding.
      expect(await indicator()).toHaveTextContent(/1 skipped/i)
    })

    it('clicking a skipped step makes it the current step, with its own way forward', async () => {
      const user = userEvent.setup()
      signInBorrower()
      mockOnboardingStep('upload_documents', { completed_steps: 1, pending_steps: ['verify_all'] })
      const resumed = mockResumeOnboarding()
      renderSuggestion()

      const stillToDo = within(await screen.findByRole('dialog')).getByRole('region', { name: /skipped: still to do/i })
      await user.click(within(stillToDo).getByRole('button', { name: /verify your tier 0 tasks/i }))

      await waitFor(() => expect(resumed).toEqual(['verify_all']))
      // Still in the popup, now on Verify All, which says where to go.
      const dialog = await screen.findByRole('dialog')
      await waitFor(() => expect(dialog).toHaveTextContent(/step 3 of 5/i))
      expect(within(dialog).getByRole('link', { name: /open step by step guide/i })).toHaveAttribute(
        'href',
        '/credit-builder/guide'
      )
      expect(screen.queryByText('Guide page')).toBeNull()
    })

    it('goes back to a skipped step when the borrower opens its page from anywhere', async () => {
      // e.g. from the menu, not the popup.
      signInBorrower()
      mockOnboardingStep('upload_documents', { completed_steps: 1, pending_steps: ['verify_all'] })
      const resumed = mockResumeOnboarding()
      renderSuggestion('/credit-builder/guide')

      await waitFor(() => expect(resumed).toEqual(['verify_all']))
    })

    it('has no to-do list when nothing was skipped', async () => {
      signInBorrower()
      mockOnboardingStep('results_ready')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).queryByRole('region', { name: /skipped/i })).toBeNull()
    })
  })

  describe('while another modal holds it back', () => {
    // e.g. the Tier 0 "submitted successfully" modal: the two never stack.
    afterEach(() => useOnboardingPopupStore.setState({ held: false }))

    it('does not open by itself, and stays closed once let go: that step has been seen', async () => {
      signInBorrower()
      useOnboardingPopupStore.getState().hold()
      const calls = mockOnboardingStep('upload_documents')
      renderSuggestion()

      await waitFor(() => expect(calls.count).toBeGreaterThan(0))
      expect(await indicator()).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).toBeNull()

      act(() => useOnboardingPopupStore.getState().release())
      await act(() => new Promise((r) => setTimeout(r, 50)))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('still opens from the Next step button', async () => {
      const user = userEvent.setup()
      signInBorrower()
      useOnboardingPopupStore.getState().hold()
      mockOnboardingStep('upload_documents')
      renderSuggestion()

      await user.click(await indicator())
      expect(await screen.findByRole('dialog')).toHaveTextContent(/upload your documents/i)
    })
  })

  describe('once Tier 0 is submitted', () => {
    // The popup that opens straight after Verify All: Tier 0 is being
    // verified, and documents can go in meanwhile - no waiting.
    it('says the tasks are being verified and what that opens, then offers documents', async () => {
      signInBorrower()
      mockOnboardingStep('upload_documents', { results_ready: false })
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      const notice = within(dialog).getByRole('status', { name: /your tier 0 tasks are being verified/i })
      expect(notice).toHaveTextContent(/credit card stacking/i)
      expect(notice).toHaveTextContent(/tier 1 vendors/i)
      expect(notice).toHaveTextContent(/meantime/i)
      expect(within(dialog).getByRole('link', { name: /upload documents/i })).toHaveAttribute('href', '/documents')
    })

    it('says nothing about verifying once the results are ready', async () => {
      signInBorrower()
      mockOnboardingStep('upload_documents', { results_ready: true })
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).queryByRole('status', { name: /being verified/i })).toBeNull()
    })

    it('has no such notice on other steps', async () => {
      signInBorrower()
      mockOnboardingStep('verify_all')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).queryByRole('status', { name: /being verified/i })).toBeNull()
    })
  })

  describe('the order', () => {
    // Paid borrowers verify Tier 0 straight after the credit profile, then upload their documents.
    it('says the credit profile unlocks Credit Card Stacking, not what step comes next', async () => {
      signInBorrower()
      mockOnboardingStep('credit_profile')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      const unlocks = within(dialog).getByRole('heading', { name: /what this unlocks/i }).parentElement as HTMLElement
      expect(unlocks).toHaveTextContent(/credit card stacking/i)
      expect(unlocks).not.toHaveTextContent(/tier 0 tasks next/i)
      expect(unlocks).not.toHaveTextContent(/documents next/i)
    })

    it('says Verify All unlocks Credit Card Stacking and Tier 1 vendors, not what step comes next', async () => {
      signInBorrower()
      mockOnboardingStep('verify_all')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      const unlocks = within(dialog).getByRole('heading', { name: /what this unlocks/i }).parentElement as HTMLElement
      expect(unlocks).toHaveTextContent(/credit card stacking/i)
      expect(unlocks).toHaveTextContent(/tier 1 vendors/i)
      expect(unlocks).not.toHaveTextContent(/documents next/i)
    })

    it('says the documents unlock funding, not what step comes next', async () => {
      signInBorrower()
      mockOnboardingStep('upload_documents')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      const unlocks = within(dialog).getByRole('heading', { name: /what this unlocks/i }).parentElement as HTMLElement
      expect(unlocks).toHaveTextContent(/funding/i)
      expect(unlocks).not.toHaveTextContent(/review next/i)
    })

    it('send the borrower to Documents, with nothing to skip', async () => {
      signInBorrower()
      mockOnboardingStep('upload_documents')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toHaveTextContent(/step 4 of 5/i)
      expect(dialog).toHaveTextContent(/upload your documents/i)
      expect(within(dialog).getByRole('link', { name: /upload documents/i })).toHaveAttribute('href', '/documents')
      expect(within(dialog).queryByRole('button', { name: /skip/i })).toBeNull()
    })

    it('asks for the four required documents only, the rest being optional', async () => {
      // The step stays until all four are in (the API decides).
      signInBorrower()
      mockOnboardingStep('upload_documents')
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toHaveTextContent(/four required documents/i)
      expect(dialog).toHaveTextContent(/driver's license/i)
      expect(dialog).toHaveTextContent(/voided business check/i)
      expect(dialog).toHaveTextContent(/ein \/ corporation docs/i)
      expect(dialog).toHaveTextContent(/business bank statements/i)
      expect(dialog).toHaveTextContent(/every other category is optional/i)
      expect(dialog).not.toHaveTextContent(/every document category/i)
    })
  })

  describe('free-trial borrowers', () => {
    // Only the start of the walkthrough: the profile and the credit profile.
    it('get the credit profile as their last step, with no Tier 0 or documents after it', async () => {
      signInBorrower({ is_free_trail: true })
      mockOnboardingStep('credit_profile', { flow: 'free_trial', total_steps: 2 })
      renderSuggestion()

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toHaveTextContent(/step 2 of 2/i)
      expect(dialog).not.toHaveTextContent(/tier 0/i)
      expect(dialog).not.toHaveTextContent(/documents/i)
    })

    it('see nothing more once their credit profile is in', async () => {
      signInBorrower({ is_free_trail: true })
      const calls = mockOnboardingStep('completed', { flow: 'free_trial', completed_steps: 2, total_steps: 2 })
      const { container } = renderSuggestion()

      await waitFor(() => expect(calls.count).toBeGreaterThan(0))
      await act(() => new Promise((r) => setTimeout(r, 50)))
      expect(container.querySelector('.onb-indicator')).toBeNull()
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('completing the profile', () => {
    it('is the first step, shown on the indicator without a second popup', async () => {
      // The Complete Your Profile popup already opens by itself for this.
      signInBorrower()
      mockOnboardingStep('complete_profile')
      renderSuggestion()

      const button = await indicator()
      expect(button).toHaveTextContent('1/5')
      expect(button).toHaveTextContent(/complete your profile/i)
      await act(() => new Promise((r) => setTimeout(r, 50)))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('lists what is missing and opens the profile on it', async () => {
      const user = userEvent.setup()
      signInBorrower()
      mockOnboardingStep('complete_profile')
      renderSuggestion()

      await user.click(await indicator())

      const dialog = await screen.findByRole('dialog')
      expect(dialog).toHaveTextContent(/step 1 of 5/i)
      expect(dialog).toHaveTextContent(/business details: 2 fields to fill in/i)
      expect(within(dialog).getByRole('link', { name: /complete profile/i })).toHaveAttribute('href', '/profile?tab=1')
      expect(within(dialog).queryByRole('button', { name: /skip/i })).toBeNull()
    })
  })

  it('shows nothing once the walkthrough is finished', async () => {
    signInBorrower()
    const calls = mockOnboardingStep('completed')
    const { container } = renderSuggestion()

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('.onb-indicator')).toBeNull()
  })
})
