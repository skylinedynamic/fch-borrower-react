import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../../../test-utils'
import TierGenericTask from '../../../../../src/pages/credit-builder/creditguide/components/TierGenericTask'
import Tier1Task from '../../../../../src/pages/credit-builder/creditguide/components/Tier1Task'
import { CREDIT_BUILDER_STATUS } from '../../../../../src/data/credit-builder'
import type { TierTask } from '../../../../../src/modules/credit-builder/guide/types'

/**
 * BUG-083: a rejected task's reason was only in a hover tooltip on the
 * "Rejected" pill, so the client never saw why. It now shows under the task.
 */
const task = (overrides: Partial<TierTask> = {}): TierTask => ({
  id: 7, title: 'Business Phone & Directory Listing', subtitle: null, description: null,
  status: CREDIT_BUILDER_STATUS.REJECTED, url: null, button_title: null, completed_at: null,
  estimated_completion_days: null, order: 1, vendor: null, migrated_task_id: null,
  note: 'phone not listed in directories', ...overrides,
})

describe('Credit guide - a rejected task', () => {
  it('shows the reviewer\'s reason under the task', () => {
    renderWithProviders(<TierGenericTask task={task()} isCurrentTier onVerifyClick={() => {}} index={0} />)

    expect(screen.getByText('Reason: phone not listed in directories')).toBeVisible()
  })

  it('shows the reason on a vendor task too', () => {
    renderWithProviders(<Tier1Task tierId={2} task={task()} index={0} />)

    expect(screen.getByText('Reason: phone not listed in directories')).toBeVisible()
  })

  it('shows no reason line when the reviewer left none', () => {
    renderWithProviders(<TierGenericTask task={task({ note: null })} isCurrentTier onVerifyClick={() => {}} index={0} />)

    expect(screen.queryByText(/^Reason:/)).not.toBeInTheDocument()
  })

  it('shows no reason line on a task that is not rejected', () => {
    renderWithProviders(<TierGenericTask task={task({ status: CREDIT_BUILDER_STATUS.VERIFIED, note: 'Looks good' })} isCurrentTier index={0} />)

    expect(screen.queryByText(/^Reason:/)).not.toBeInTheDocument()
  })
})
