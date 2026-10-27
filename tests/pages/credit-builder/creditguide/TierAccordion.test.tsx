import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'
import { renderWithProviders, screen, waitFor, within } from '../../../test-utils'
import { server } from '../../../mocks/server'
import { mockOnboardingStep, signInBorrower, signOutBorrower } from '../../../mocks/onboarding'
import TierAccordion from '../../../../src/pages/credit-builder/creditguide/components/TierAccordion'
import type { Tier, TierTask } from '../../../../src/modules/credit-builder/guide/types'
import { useOnboardingPopupStore } from '../../../../src/store/onboardingPopupStore'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const task = (id: number, title: string, overrides: Partial<TierTask> = {}): TierTask => ({
  id,
  title,
  subtitle: null,
  description: null,
  status: null,
  url: null,
  button_title: null,
  completed_at: null,
  estimated_completion_days: null,
  order: id,
  vendor: null,
  migrated_task_id: null,
  ...overrides,
})

const tier = (code: string, tasks: TierTask[]): Tier => ({
  id: code === 'T0' ? 1 : 2,
  code,
  name: code === 'T0' ? 'Tier 0' : 'Tier 1',
  title: 'Foundation',
  subtitle: '',
  description: null,
  status: null,
  order: 1,
  has_vendor: 0,
  task_to_complete: null,
  tasks,
})

const tier0 = () =>
  tier('T0', [
    task(11, 'Register an EIN'),
    task(12, 'Open a business bank account'),
    task(13, 'Get a business phone number', { status: 'processing' }),
    task(14, 'Register with D&B', { status: 'verified', completed_at: 'Oct 01, 2026' }),
    task(15, 'Business website', { status: 'rejected', note: 'Domain does not match' }),
  ])

function renderTier(t: Tier, props: Partial<React.ComponentProps<typeof TierAccordion>> = {}) {
  return renderWithProviders(
    <TierAccordion tier={t} isOpen onToggle={() => {}} isCurrentTier isFirstTier {...props} />
  )
}

/** Captures every verification request the page sends. */
function captureVerifyRequests(response: () => Response = () => HttpResponse.json({ success: true, message: 'Submitted', data: [] })) {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.post('*/borrower/credit-builder/task-verify-request', async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>)
      return response()
    }),
    // The mutation refetches the task list on success.
    http.get('*/borrower/credit-builder/tier-wise-tasklist', () => HttpResponse.json({ status: true, data: [] }))
  )
  return bodies
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => {
  server.resetHandlers()
  signOutBorrower()
  useOnboardingPopupStore.setState({ held: false })
})

describe('Step by Step Guide - Tier 0 "Verify All"', () => {
  it('offers to submit every task that still needs verifying', () => {
    renderTier(tier0())

    // Two never-submitted tasks and one rejected; not the one in review or the verified one.
    expect(screen.getByText(/3 tasks ready to submit/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify all/i })).toBeInTheDocument()
  })

  it('lists the tasks it will submit, then sends them in one request', async () => {
    const user = userEvent.setup()
    const bodies = captureVerifyRequests()
    renderTier(tier0())

    await user.click(screen.getByRole('button', { name: /verify all/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Register an EIN')).toBeInTheDocument()
    expect(within(dialog).getByText('Open a business bank account')).toBeInTheDocument()
    expect(within(dialog).getByText('Business website')).toBeInTheDocument()
    expect(within(dialog).queryByText('Get a business phone number')).toBeNull()
    expect(within(dialog).queryByText('Register with D&B')).toBeNull()

    await user.click(within(dialog).getByRole('button', { name: /submit 3 tasks/i }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ task_ids: [11, 12, 15], migrated_task_id: null, tier_id: 1 })
    // Tier 0 says so in a modal of its own (see "once Tier 0 tasks are submitted").
    expect(await screen.findByRole('dialog', { name: /submitted successfully/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /submit 3 tasks/i })).toBeNull()
  })

  it('sends a migrated task in its own request, since the migration id is per request', async () => {
    const user = userEvent.setup()
    const bodies = captureVerifyRequests()
    renderTier(
      tier('T0', [task(11, 'Register an EIN'), task(12, 'Carried-over task', { migrated_task_id: 9 })])
    )

    await user.click(screen.getByRole('button', { name: /verify all/i }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /submit 2 tasks/i }))

    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies).toEqual(
      expect.arrayContaining([
        { task_ids: [11], migrated_task_id: null, tier_id: 1 },
        { task_ids: [12], migrated_task_id: 9, tier_id: 1 },
      ])
    )
  })

  it('reports a refusal and leaves the tasks to try again', async () => {
    const user = userEvent.setup()
    captureVerifyRequests(() => HttpResponse.json({ message: 'Task already completed.' }, { status: 422 }))
    renderTier(tier0())

    await user.click(screen.getByRole('button', { name: /verify all/i }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /submit 3 tasks/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Task already completed.'))
  })

  it('is not offered once nothing is left to submit', () => {
    renderTier(
      tier('T0', [
        task(13, 'Get a business phone number', { status: 'processing' }),
        task(14, 'Register with D&B', { status: 'verified' }),
      ])
    )

    expect(screen.queryByRole('button', { name: /verify all/i })).toBeNull()
  })

  it('is only for Tier 0', () => {
    renderTier(tier('T1', [task(21, 'Uline'), task(22, 'Quill')]))

    expect(screen.queryByRole('button', { name: /verify all/i })).toBeNull()
  })

  it('is not offered on a tier the borrower cannot work on yet', () => {
    renderTier(tier0(), { isCurrentTier: false, isFirstTier: false })

    expect(screen.queryByRole('button', { name: /verify all/i })).toBeNull()
  })
})

describe('Step by Step Guide - pointing at Verify All', () => {
  // A finger pointing at the button, with a text alternative for screen readers.
  const pointer = () => screen.queryByRole('img', { name: /submit all your tasks here/i })

  it('points at Verify All while the walkthrough is on the Verify All step', async () => {
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderTier(tier0())

    expect(await screen.findByRole('img', { name: /submit all your tasks here/i })).toBeInTheDocument()
    // An icon, not another button-shaped label.
    expect(pointer()).not.toHaveTextContent(/\w/)
    expect(screen.queryAllByRole('button', { name: /submit all your tasks here/i })).toHaveLength(0)
    expect(screen.getByRole('button', { name: /verify all/i })).toHaveClass('is-guided')
  })

  it('stays quiet on any other step of the walkthrough', async () => {
    signInBorrower()
    const calls = mockOnboardingStep('upload_documents')
    renderTier(tier0())

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await new Promise((r) => setTimeout(r, 50))
    expect(pointer()).toBeNull()
    expect(screen.getByRole('button', { name: /verify all/i })).not.toHaveClass('is-guided')
  })

  it('does not appear for someone who is not on the walkthrough', () => {
    renderTier(tier0())

    expect(pointer()).toBeNull()
  })

  it('goes away once the borrower has used the button', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderTier(tier0())

    await screen.findByRole('img', { name: /submit all your tasks here/i })
    await user.click(screen.getByRole('button', { name: /verify all/i }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(pointer()).toBeNull()
  })
})

describe('Step by Step Guide - task buttons', () => {
  it('submits a single task for verification after confirming', async () => {
    const user = userEvent.setup()
    const bodies = captureVerifyRequests()
    renderTier(tier0())

    const row = screen.getByText('Register an EIN').closest('[data-task]') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /submit for verification/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Register an EIN')
    await user.click(within(dialog).getByRole('button', { name: /^submit for verification$/i }))

    await waitFor(() => expect(bodies).toEqual([{ task_ids: [11], migrated_task_id: null, tier_id: 1 }]))
  })

  it('can be cancelled without sending anything', async () => {
    const user = userEvent.setup()
    const bodies = captureVerifyRequests()
    renderTier(tier0())

    const row = screen.getByText('Register an EIN').closest('[data-task]') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /submit for verification/i }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(bodies).toHaveLength(0)
  })

  it('uses the task’s own button label when the admin set one', () => {
    renderTier(tier('T0', [task(11, 'Register an EIN', { button_title: 'I have an EIN' })]))

    const row = screen.getByText('Register an EIN').closest('[data-task]') as HTMLElement
    expect(within(row).getByRole('button', { name: /i have an ein/i })).toBeInTheDocument()
  })

  it('shows the state of tasks that are not waiting on the borrower', () => {
    renderTier(tier0())

    const inReview = screen.getByText('Get a business phone number').closest('[data-task]') as HTMLElement
    expect(inReview).toHaveTextContent(/in review/i)
    expect(within(inReview).queryByRole('button')).toBeNull()

    const verified = screen.getByText('Register with D&B').closest('[data-task]') as HTMLElement
    expect(verified).toHaveTextContent(/verified/i)
    expect(within(verified).queryByRole('button')).toBeNull()

    const rejected = screen.getByText('Business website').closest('[data-task]') as HTMLElement
    expect(rejected).toHaveTextContent(/rejected/i)
    expect(within(rejected).getByRole('button', { name: /submit again/i })).toBeInTheDocument()
  })

  it('offers no submit button on a tier the borrower cannot work on yet', () => {
    renderTier(tier0(), { isCurrentTier: false, isFirstTier: false })

    const row = screen.getByText('Register an EIN').closest('[data-task]') as HTMLElement
    expect(within(row).queryByRole('button')).toBeNull()
    expect(row).toHaveTextContent(/pending/i)
  })
})

describe('Step by Step Guide - once Tier 0 tasks are submitted', () => {
  const submitOne = async (user: ReturnType<typeof userEvent.setup>, title = 'Register an EIN') => {
    const row = screen.getByText(title).closest('[data-task]') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /submit for verification/i }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /^submit for verification$/i }))
  }

  it('says one task was submitted, that our team verifies it, and what Tier 0 unlocks', async () => {
    const user = userEvent.setup()
    captureVerifyRequests()
    renderTier(tier0())

    await submitOne(user)

    const done = await screen.findByRole('dialog', { name: /submitted successfully/i })
    expect(done).toHaveTextContent(/our team will verify/i)
    expect(done).toHaveTextContent(/let you know/i)
    expect(done).toHaveTextContent(/credit card stacking/i)
    expect(done).toHaveTextContent(/tier 1 vendors/i)
    expect(toast.success).not.toHaveBeenCalled()

    await user.click(within(done).getByRole('button', { name: /got it/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('says all of them were submitted after Verify All', async () => {
    const user = userEvent.setup()
    captureVerifyRequests()
    renderTier(tier0())

    await user.click(screen.getByRole('button', { name: /verify all/i }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /submit 3 tasks/i }))

    const done = await screen.findByRole('dialog', { name: /submitted successfully/i })
    expect(done).toHaveTextContent(/3 tasks/i)
  })

  it('offers the next walkthrough step, uploading documents, once Tier 0 is all in', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('upload_documents')
    captureVerifyRequests()
    renderTier(tier0())

    await submitOne(user)

    const done = await screen.findByRole('dialog', { name: /submitted successfully/i })
    expect(await within(done).findByRole('link', { name: /upload your documents/i })).toHaveAttribute('href', '/documents')
  })

  it('offers no next step while other Tier 0 tasks are still to submit', async () => {
    const user = userEvent.setup()
    signInBorrower()
    const calls = mockOnboardingStep('verify_all')
    captureVerifyRequests()
    renderTier(tier0())

    await submitOne(user)

    const done = await screen.findByRole('dialog', { name: /submitted successfully/i })
    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    expect(within(done).queryByRole('link', { name: /upload your documents/i })).toBeNull()
  })

  it('keeps a plain toast for tasks on later tiers', async () => {
    const user = userEvent.setup()
    captureVerifyRequests()
    // A tier past Tier 1 (Tier 1's own tasks submit from their instructions).
    renderTier(tier('T5', [task(21, 'Open a vendor account')]))

    await submitOne(user, 'Open a vendor account')

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Submitted'))
    expect(screen.queryByRole('dialog', { name: /submitted successfully/i })).toBeNull()
  })

  it('holds the walkthrough popup back while it is open, and lets it go after', async () => {
    const user = userEvent.setup()
    captureVerifyRequests()
    renderTier(tier0())

    await submitOne(user)
    const done = await screen.findByRole('dialog', { name: /submitted successfully/i })
    expect(useOnboardingPopupStore.getState().held).toBe(true)

    await user.click(within(done).getByRole('button', { name: /got it/i }))
    await waitFor(() => expect(useOnboardingPopupStore.getState().held).toBe(false))
  })

  it('lets the walkthrough popup go if the submission fails', async () => {
    const user = userEvent.setup()
    captureVerifyRequests(() => HttpResponse.json({ message: 'Nope' }, { status: 422 }))
    renderTier(tier0())

    await submitOne(user)

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(useOnboardingPopupStore.getState().held).toBe(false)
  })
})

// BUG-024: from Tier 1 on a tier needs only task_to_complete of its tasks (1) -
// doing one opens the next tier. The count is out of what it needs, and doing
// more than that reads complete (1/1), never "2/1".
describe('TierAccordion - a tier that needs fewer tasks than it lists', () => {
  const vendorTier = (statuses: (TierTask['status'])[]) => ({
    ...tier('T1', statuses.map((status, i) => task(21 + i, `Vendor ${i + 1}`, { status }))),
    task_to_complete: 1,
  })

  it('counts out of the tasks it needs', () => {
    renderTier(vendorTier([null, null, null]), { isFirstTier: false })

    expect(screen.getByText('0/1')).toBeInTheDocument()
  })

  it('reads complete, not more than complete, when more were done', () => {
    renderTier(vendorTier(['verified', 'verified', null]), { isFirstTier: false })

    expect(screen.getByText('1/1')).toBeInTheDocument()
    expect(screen.queryByText('2/1')).not.toBeInTheDocument()
  })
})

