import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import CreditGuide from '../../../src/pages/credit-builder/creditguide/CreditGuide'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const task = (id: number, title: string, status: string | null = null) => ({
  id, title, subtitle: null, description: null, status, url: null, button_title: null,
  completed_at: null, estimated_completion_days: 3, order: id, vendor: null, migrated_task_id: null, note: null,
})

const tier = (id: number, code: string, name: string, title: string, tasks: ReturnType<typeof task>[]) => ({
  id, code, name, title, subtitle: `${title} subtitle`, description: null, status: null,
  order: id, has_vendor: 0, task_to_complete: null, tasks,
})

const progress = (overrides: Record<string, unknown> = {}) => ({
  id: 1, name: 'Tier 0', title: 'Foundation', subtitle: '', description: '',
  current_tier_estimated_completion_days: 6, current_tier_tasks_remaining: 1, current_tier_complete_task: 1,
  current_tier_complete_percentage: 50, total_tasks_remaining: 5, total_complete_task: 1, total_complete_percentage: 14,
  tiers: [], ...overrides,
})

function serve(tiers: unknown[], progressData = progress()) {
  server.use(
    http.get('*/borrower/credit-builder/tier-wise-tasklist', () => HttpResponse.json({ status: true, data: tiers })),
    http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.json({ status: true, data: progressData }))
  )
}

const standardTiers = () => [
  tier(1, 'T0', 'Tier 0', 'Business Foundation', [task(11, 'Register an EIN', 'verified'), task(12, 'Open a bank account')]),
  tier(2, 'T1', 'Tier 1', 'Starter Vendors', [task(21, 'Uline'), task(22, 'Quill'), task(23, 'Grainger')]),
]

const header = (name: RegExp) => screen.getByRole('button', { name })

beforeEach(() => vi.clearAllMocks())
afterEach(() => server.resetHandlers())

describe('CreditGuide', () => {
  it('shows the error card when the tier task list or progress fails to load', async () => {
    server.use(
      http.get('*/borrower/credit-builder/tier-wise-tasklist', () => HttpResponse.error()),
      http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.error())
    )

    renderWithProviders(<CreditGuide />)

    expect(await screen.findByText('Failed to load credit guide')).toBeInTheDocument()
  })

  it('shows a skeleton of the page while it loads', () => {
    server.use(
      http.get('*/borrower/credit-builder/tier-wise-tasklist', () => new Promise(() => {})),
      http.get('*/borrower/credit-builder/my-progress', () => new Promise(() => {}))
    )

    renderWithProviders(<CreditGuide />)

    expect(screen.getByRole('status', { name: /loading credit guide/i })).toHaveAttribute('aria-busy', 'true')
  })

  describe('where the borrower stands', () => {
    it('shows the current tier, overall progress, time to the next tier and tasks done', async () => {
      serve(standardTiers())
      renderWithProviders(<CreditGuide />)

      // The title is on screen at once; the numbers arrive with the data.
      expect(screen.getByRole('heading', { name: /credit building guide/i })).toBeInTheDocument()
      await screen.findByText('Current Tier')
      for (const [label, value] of [
        ['Current Tier', 'Tier 0'],
        ['Overall Progress', '14%'],
        ['Est. Time to Next Tier', '6 Days'],
        ['Tasks Completed', '1/6'],
      ]) {
        const stat = screen.getByText(label).closest('[data-stat]') as HTMLElement
        expect(stat).not.toBeNull()
        expect(stat).toHaveTextContent(value)
      }
    })

    it('says so when there is nothing left to wait for on this tier', async () => {
      serve(standardTiers(), progress({ current_tier_estimated_completion_days: 0 }))
      renderWithProviders(<CreditGuide />)

      await screen.findByText('Est. Time to Next Tier')
      expect(screen.getByText('Est. Time to Next Tier').closest('[data-stat]')).toHaveTextContent('Ready for Next Tier')
    })
  })

  describe('the tiers', () => {
    it('lists every tier with how many of its tasks are verified', async () => {
      serve(standardTiers())
      renderWithProviders(<CreditGuide />)

      const first = await screen.findByRole('button', { name: /tier 0.*business foundation/i })
      expect(first).toHaveTextContent('1/2')
      expect(header(/tier 1.*starter vendors/i)).toHaveTextContent('0/3')
    })

    it("opens on the borrower's current tier and keeps later tiers locked", async () => {
      serve(standardTiers())
      renderWithProviders(<CreditGuide />)

      const first = await screen.findByRole('button', { name: /tier 0.*business foundation/i })
      expect(first).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Register an EIN')).toBeInTheDocument()

      const second = header(/tier 1.*starter vendors/i)
      expect(second).toHaveAttribute('aria-expanded', 'false')
      expect(second).toHaveAttribute('aria-disabled', 'true')
      expect(screen.queryByText('Uline')).toBeNull()
    })

    it('labels each tier: in progress, locked, or completed', async () => {
      serve(
        [
          tier(1, 'T0', 'Tier 0', 'Business Foundation', [task(11, 'Register an EIN', 'verified'), task(12, 'Open a bank account', 'verified')]),
          tier(2, 'T1', 'Tier 1', 'Starter Vendors', [task(21, 'Uline')]),
          tier(3, 'T2', 'Tier 2', 'Growth Vendors', [task(31, 'Quill')]),
        ],
        progress({ id: 2 })
      )
      renderWithProviders(<CreditGuide />)

      await screen.findByRole('button', { name: /tier 0.*business foundation/i })
      expect(header(/tier 0.*business foundation/i)).toHaveTextContent(/completed/i)
      expect(header(/tier 1.*starter vendors/i)).toHaveTextContent(/in progress/i)
      expect(header(/tier 2.*growth vendors/i)).toHaveTextContent(/locked/i)
    })

    it('explains which tiers to finish first when a locked tier is clicked', async () => {
      const user = userEvent.setup()
      serve(standardTiers())
      renderWithProviders(<CreditGuide />)

      await screen.findByRole('button', { name: /tier 0.*business foundation/i })
      await user.click(header(/tier 1.*starter vendors/i))

      expect(toast.error).toHaveBeenCalledWith('You have to complete Tier 0')
      expect(screen.queryByText('Uline')).toBeNull()
    })

    it('collapses and reopens a tier from its header, with the keyboard too', async () => {
      const user = userEvent.setup()
      serve(standardTiers())
      renderWithProviders(<CreditGuide />)

      const first = await screen.findByRole('button', { name: /tier 0.*business foundation/i })
      await user.click(first)
      expect(first).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Register an EIN')).toBeNull()

      first.focus()
      await user.keyboard('{Enter}')
      expect(first).toHaveAttribute('aria-expanded', 'true')
      expect(within(document.body).getByText('Register an EIN')).toBeInTheDocument()
    })
  })
})
