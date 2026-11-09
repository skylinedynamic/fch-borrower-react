import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '../../test-utils'
import { ActivityItem } from '../../../src/pages/funding-requests/FundingRequestDetailPage'

/**
 * BUG-004 (QA round 2): activity descriptions are HTML from the API, written
 * with names people typed; a name like `<img src=x onerror=...>` ran in the
 * admin's Activity panel. Here too the details keep formatting only.
 */
describe('Funding request activity - details cannot run script (BUG-004)', () => {
  it('shows the description without the onerror handler', async () => {
    const activity = {
      id: 1, event_label: 'Note Added', log_type_raw: 'activity', created_at: '2026-10-21T10:00:00Z',
      description: '<p><b>Called</b> R2-XSS <img src=x onerror="window.__xss = 1"></p>', attachments: [],
    }
    const view = renderWithProviders(<ActivityItem activity={activity} review={{}} isFirst={false} />)

    await userEvent.click(screen.getByText('Note Added'))

    expect(await screen.findByText('Called')).toBeInTheDocument()
    expect(view.container.querySelector('[onerror]')).toBeNull()
  })
})
