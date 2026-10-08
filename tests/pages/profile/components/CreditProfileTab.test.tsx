import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient, renderWithProviders } from '../../../test-utils'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../../../src/store/auth'
import { queryKeys } from '../../../../src/lib/query'
import CreditProfileTab from '../../../../src/pages/profile/components/CreditProfileTab'
import CreditScoreHero from '../../../../src/pages/profile/components/CreditScoreHero'
import CreditAccountHealth from '../../../../src/pages/profile/components/CreditAccountHealth'
import CreditAccountsBreakdown from '../../../../src/pages/profile/components/CreditAccountsBreakdown'
import CreditIdentityPanel from '../../../../src/pages/profile/components/CreditIdentityPanel'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const bureauProfile = {
  id: 1,
  personal_info: {
    name: 'Jane Borrower',
    dob: '1990-01-01',
    ssn: '123456789',
    email: 'jane@example.com',
    phone: '5125550100',
  },
  addresses: [],
  metrics: {
    fico_score: 700,
    paydex_score: null,
    experian_intelliscore: null,
    equifax_score: null,
    active_tradelines: null,
    total_credit_limit: null,
    credit_utilization: null,
    recent_inquiries: null,
    delinquent_accounts: null,
    public_records: null,
    collections: null,
    delinquencies_30_60_90: null,
    summary: null,
    all_accounts_analysis: {},
    open_accounts_analysis: {},
  },
}

const resetAuth = () =>
  useAuthStore.setState({
    token: 'tok',
    user: { id: 1, credit_profile_updated: true },
    userSubscription: null,
    rememberMe: true,
  })

const renderTab = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CreditProfileTab />
    </QueryClientProvider>,
  )
}

/**
 * The Credit Profile tab, and the four pieces it is built from.
 *
 * One file per tab of the profile page. These were five separate files for
 * what a borrower reads as a single screen, so a change to the tab meant
 * hunting for which of them held the assertion that broke.
 */
describe('Profile — Credit Profile tab', () => {
  // The tab reads the Personal Info profile to pre-fill its form; unless a test
  // says otherwise there is nothing on file.
  beforeEach(() => {
    server.use(
      http.get('*/borrower/profile/personal-info', () => HttpResponse.json({ status: true, data: null }))
    )
  })

  describe('the tab itself (PII)', () => {
    afterEach(() => {
      server.resetHandlers()
      useAuthStore.setState({
        token: undefined,
        user: null,
        userSubscription: null,
        rememberMe: true,
      })
      vi.restoreAllMocks()
    })

    it('masks the SSN by default, showing only the last 4 digits', async () => {
      resetAuth()
      server.use(
        http.get('*/borrower/profile/credit-profile', () =>
          HttpResponse.json({ status: true, data: bureauProfile }),
        ),
      )

      const user = userEvent.setup()
      renderTab()

      // Identity now sits in a panel that starts closed, so the figures lead the
      // tab. Closed, the digits are not in the document at all.
      const panel = await screen.findByRole('button', {
        name: /identity on file/i,
      })
      expect(screen.queryByText('***-**-6789')).not.toBeInTheDocument()

      await user.click(panel)

      expect(await screen.findByText('***-**-6789')).toBeInTheDocument()
      expect(screen.queryByText('123456789')).not.toBeInTheDocument()
    })

    it('reveals the full SSN only after the user clicks "Reveal", and can hide it again', async () => {
      resetAuth()
      server.use(
        http.get('*/borrower/profile/credit-profile', () =>
          HttpResponse.json({ status: true, data: bureauProfile }),
        ),
      )

      const user = userEvent.setup()
      renderTab()

      await user.click(await screen.findByRole('button', { name: /identity on file/i }))
      await screen.findByText('***-**-6789')
      await user.click(screen.getByRole('button', { name: /Reveal/i }))

      expect(await screen.findByText('123456789')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /Hide/i }))
      await waitFor(() => expect(screen.getByText('***-**-6789')).toBeInTheDocument())
    })
  })

  /**
   * The scores at the top of the credit profile.
   *
   * Four bureau scores used to sit here as equal tiles. Only one of them was ever
   * filled. The credit pull is iSoftpull, a consumer product, so its report has no
   * business-bureau figures in it at all: Experian Intelliscore and Equifax parsed
   * to null on every pull, and nothing in the application read either of them - no
   * lender rule, no readiness score, not even the admin panel. Two permanently
   * empty tiles on a credit screen do not read as "not applicable", they read as
   * "your data failed to load".
   *
   * Paydex is the opposite problem. It is not empty and it is not from the pull -
   * it is typed in by hand on the admin side ("Business Credit Scores (D&B
   * PAYDEX)") and it decides a lender's min_business_credit_score. Sitting in the
   * same row as FICO it looked equally bureau-verified, which is worse than an
   * empty tile: an empty tile at least does not assert anything.
   *
   * So: FICO leads, because it is the score six different decisions actually run
   * on. The self-reported figure is kept, separately and labelled as such. The two
   * dead ones are gone from the screen - the columns and API fields stay, ready
   * for a business-bureau integration that has not happened yet.
   */
  describe('the score and the band it falls in', () => {
    const metrics = {
      fico_score: 712,
      paydex_score: 80,
      // Still on the payload, and still to be ignored by this component.
      experian_intelliscore: 55,
      equifax_score: 600,
      active_tradelines: 9,
      total_credit_limit: 42500,
      credit_utilization: 31,
      recent_inquiries: 2,
    } as never

    // ── FICO, the score the platform actually decides on ──────────────────

    it('leads with the FICO score and its scale', () => {
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      expect(screen.getByText('712')).toBeInTheDocument()

      // The scale is drawn as its five named bands between its two ends, so the
      // reader can see which band they are in and what the next one would take.
      expect(screen.getByText('300')).toBeInTheDocument()
      expect(screen.getByText('850')).toBeInTheDocument()
    })

    it('measures the FICO bar against the FICO scale', () => {
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      const fico = screen.getByRole('progressbar', { name: 'FICO' })

      expect(fico).toHaveAttribute('aria-valuemin', '300')
      expect(fico).toHaveAttribute('aria-valuemax', '850')
      expect(fico).toHaveAttribute('aria-valuenow', '712')
    })

    // ── the two scores no pull ever returns ───────────────────────────────

    it('does not show Experian Intelliscore or Equifax', () => {
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      expect(screen.queryByText(/Intelliscore/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Equifax/i)).not.toBeInTheDocument()
    })

    it('ignores their values even when the payload carries them', () => {
      // The API still returns these fields. A value arriving in one is not a
      // reason to put it back on screen - nothing has verified it.
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      expect(screen.queryByText('55')).not.toBeInTheDocument()
      expect(screen.queryByText('600')).not.toBeInTheDocument()
      expect(screen.queryByText('1–100')).not.toBeInTheDocument()
      expect(screen.queryByText('101–992')).not.toBeInTheDocument()
    })

    // ── the self-reported business figure ─────────────────────────────────

    it('shows the business credit score on its own scale', () => {
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      expect(screen.getByText('80')).toBeInTheDocument()
      expect(screen.getByText('0–100')).toBeInTheDocument()

      const business = screen.getByRole('progressbar', {
        name: 'Business Credit Score',
      })
      expect(business).toHaveAttribute('aria-valuemin', '0')
      expect(business).toHaveAttribute('aria-valuemax', '100')
    })

    it('says the business credit score is self-reported', () => {
      // It reaches this screen by being typed into the admin panel, not from a
      // bureau. Shown next to FICO without that, it reads as verified.
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      expect(screen.getByText(/self-reported/i)).toBeInTheDocument()
    })

    it('leaves the business figure out entirely when there is none', () => {
      // Nobody typed one in. An empty tile would invite the same "my data is
      // missing" reading the dead bureau tiles caused.
      renderWithProviders(<CreditScoreHero metrics={{ fico_score: 712 } as never} />)

      expect(screen.queryByText(/self-reported/i)).not.toBeInTheDocument()
      expect(
        screen.queryByRole('progressbar', { name: 'Business Credit Score' }),
      ).not.toBeInTheDocument()
    })

    // ── the figures that explain a score ──────────────────────────────────

    it('keeps the figures that explain the scores alongside them', () => {
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      expect(screen.getByText('$42,500')).toBeInTheDocument()
      expect(screen.getByText('31%')).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
    })

    // ── nothing to show ───────────────────────────────────────────────────

    it('shows a dash rather than a zero when FICO is missing', () => {
      // A pull that returned nothing is not a score of 0, which on FICO would
      // read as catastrophic.
      renderWithProviders(<CreditScoreHero metrics={{ paydex_score: 80 } as never} />)

      // The supporting figures dash out too on a payload this bare, so the FICO
      // bar is what pins it: present, and reading empty rather than reading 0.
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
      expect(screen.getByRole('progressbar', { name: 'FICO' })).toHaveAttribute(
        'aria-valuenow',
        '0',
      )
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('survives a profile with no metrics at all', () => {
      expect(() =>
        renderWithProviders(<CreditScoreHero metrics={undefined as never} />),
      ).not.toThrow()
    })

    // ── the band, which is what a number actually means ───────────────────

    /**
     * 777 tells a borrower nothing unless they already know the FICO bands. The
     * published boundaries are 300-579 Poor, 580-669 Fair, 670-739 Good, 740-799
     * Very Good, 800-850 Exceptional, and the gauge is coloured from the same
     * table - so the words and the colour can never disagree.
     */
    it.each([
      [812, 'Exceptional'],
      [777, 'Very Good'],
      [700, 'Good'],
      [600, 'Fair'],
      [500, 'Poor'],
    ])('names the band a score of %i falls in', (score, band) => {
      renderWithProviders(<CreditScoreHero metrics={{ fico_score: score } as never} />)

      // Every band is named on the scale; the pill is the one that says which of
      // them this borrower is actually in.
      expect(screen.getByTestId('fico-band')).toHaveTextContent(band)
    })

    it.each([
      [579, 'Poor'],
      [580, 'Fair'],
      [669, 'Fair'],
      [670, 'Good'],
      [739, 'Good'],
      [740, 'Very Good'],
      [799, 'Very Good'],
      [800, 'Exceptional'],
    ])('puts %i on the correct side of a band boundary', (score, band) => {
      // Off-by-one here would tell a borrower they are in a band they are not.
      renderWithProviders(<CreditScoreHero metrics={{ fico_score: score } as never} />)

      expect(screen.getByTestId('fico-band')).toHaveTextContent(band)
    })

    it('claims no band when there is no score to place in one', () => {
      // The scale still renders - it is the scale, not a reading of this file -
      // but nothing asserts where this borrower sits on it.
      renderWithProviders(<CreditScoreHero metrics={{} as never} />)

      expect(screen.getByTestId('fico-band')).toHaveTextContent('Not reported')
      expect(document.querySelector('.cp-scale-band.is-current')).toBeNull()
    })

    it('marks the band the borrower is in on the scale itself', () => {
      renderWithProviders(<CreditScoreHero metrics={{ fico_score: 777 } as never} />)

      const current = document.querySelectorAll('.cp-scale-band.is-current')

      expect(current).toHaveLength(1)
      expect(current[0]).toHaveTextContent('Very Good')
    })

    it('reports the range to a reader who cannot see the bands', () => {
      // The coloured segments are decorative; this is what carries the score.
      renderWithProviders(<CreditScoreHero metrics={metrics} />)

      const fico = screen.getByRole('progressbar', { name: 'FICO' })

      expect(fico).toHaveAttribute('aria-valuemin', '300')
      expect(fico).toHaveAttribute('aria-valuemax', '850')
      expect(fico).toHaveAttribute('aria-valuenow', '712')
    })
  })

  /**
   * The negative marks on a borrower's file.
   *
   * These sat sixth on the page, in a card of grey label/value rows identical to
   * the two accounts-analysis cards either side of it - so "Collections: 3" was
   * drawn exactly like "Closed Accounts: 3". The one figure on this tab that
   * should stop a borrower reading carried no more weight than a tally.
   *
   * A clean file and a damaged one are different messages, so they are allowed to
   * look different: zero is stated plainly and once, anything above zero is
   * called out. `delinquencies_30_60_90` is shown here too - it was on the
   * payload and rendered nowhere.
   */
  describe('negative marks on file', () => {
    const clean = {
      delinquent_accounts: 0,
      public_records: 0,
      collections: 0,
      delinquencies_30_60_90: '0/0/0' as string | null,
    }

    it('says plainly when there is nothing negative on file', () => {
      renderWithProviders(<CreditAccountHealth metrics={clean as never} />)

      expect(screen.getByText(/no negative marks/i)).toBeInTheDocument()
    })

    it('does not label a clean file as a problem', () => {
      const { container } = renderWithProviders(<CreditAccountHealth metrics={clean as never} />)

      expect(container.querySelector('.text-danger')).toBeNull()
    })

    it('calls out a mark that is actually there', () => {
      renderWithProviders(<CreditAccountHealth metrics={{ ...clean, collections: 3 } as never} />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.queryByText(/no negative marks/i)).not.toBeInTheDocument()
    })

    it('marks only the figure that is non-zero, not the whole card', () => {
      // A borrower with one collection and no public records should be able to
      // see which of the three it is without reading all of them.
      renderWithProviders(<CreditAccountHealth metrics={{ ...clean, collections: 3 } as never} />)

      const collections = screen.getByTestId('health-collections')
      const publicRecords = screen.getByTestId('health-public-records')

      expect(collections.className).toContain('text-danger')
      expect(publicRecords.className).not.toContain('text-danger')
    })

    it('shows the 30/60/90 day delinquency figure the payload carries', () => {
      // On the payload since the profile shipped and rendered nowhere.
      renderWithProviders(
        <CreditAccountHealth metrics={{ ...clean, delinquencies_30_60_90: '1/0/2' } as never} />,
      )

      expect(screen.getByText('1/0/2')).toBeInTheDocument()
    })

    it('leaves the 30/60/90 row out when the pull did not report one', () => {
      renderWithProviders(
        <CreditAccountHealth metrics={{ ...clean, delinquencies_30_60_90: null } as never} />,
      )

      expect(screen.queryByText(/30\/60\/90/i)).not.toBeInTheDocument()
    })

    it('distinguishes "none reported" from a count of zero', () => {
      // A pull that returned nothing is not a clean file - it is an unknown one,
      // and telling a borrower they are clean on that basis would be a lie.
      renderWithProviders(<CreditAccountHealth metrics={{} as never} />)

      expect(screen.queryByText(/no negative marks/i)).not.toBeInTheDocument()
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    it('survives a profile with no metrics at all', () => {
      expect(() =>
        renderWithProviders(<CreditAccountHealth metrics={undefined as never} />),
      ).not.toThrow()
    })
  })

  /**
   * The account figures, in one card instead of two.
   *
   * "Open Accounts Analysis" and "All Accounts Analysis" were separate cards with
   * matching headers, matching icons and ten label/value rows between them. They
   * describe the same set of accounts from two angles, and split across two boxes
   * a borrower had to hold one half in their head to read the other.
   *
   * Money is formatted as money and a ratio as a ratio - the figures arrive as
   * bare numbers and were previously formatted inline at each call site.
   */
  describe('the account figures', () => {
    const metrics = {
      open_accounts_analysis: {
        monthly_payments: 1250,
        balance: 13200,
        credit_limit: 42500,
        available_credit: 29300,
        utilization_ratio: 31,
      },
      all_accounts_analysis: {
        total_accounts: 14,
        open_accounts: 9,
        closed_accounts: 5,
        newest_open_date: '2025-02-11',
        oldest_open_date: '2016-08-03',
      },
    } as never

    it('shows the open-account figures as money', () => {
      renderWithProviders(<CreditAccountsBreakdown metrics={metrics} />)

      expect(screen.getByText('$1,250')).toBeInTheDocument()
      expect(screen.getByText('$13,200')).toBeInTheDocument()
      expect(screen.getByText('$42,500')).toBeInTheDocument()
      expect(screen.getByText('$29,300')).toBeInTheDocument()
    })

    it('shows the utilization ratio as a percentage', () => {
      renderWithProviders(<CreditAccountsBreakdown metrics={metrics} />)

      expect(screen.getByText('31%')).toBeInTheDocument()
    })

    it('shows the whole-file counts alongside them', () => {
      renderWithProviders(<CreditAccountsBreakdown metrics={metrics} />)

      expect(screen.getByText('14')).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('keeps both halves in a single card', () => {
      // The point of the merge: one box, not two matching ones.
      const { container } = renderWithProviders(<CreditAccountsBreakdown metrics={metrics} />)

      expect(container.querySelectorAll('.card')).toHaveLength(1)
    })

    it('dashes a figure the pull did not report rather than showing $0', () => {
      // $0 available credit is a real and alarming number; "not reported" is not.
      renderWithProviders(
        <CreditAccountsBreakdown
          metrics={{ open_accounts_analysis: { balance: 13200 } } as never}
        />,
      )

      expect(screen.getByText('$13,200')).toBeInTheDocument()
      expect(screen.queryByText('$0')).not.toBeInTheDocument()
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    it('survives a profile with no metrics at all', () => {
      expect(() =>
        renderWithProviders(<CreditAccountsBreakdown metrics={undefined as never} />),
      ).not.toThrow()
    })
  })

  /**
   * What the bureau holds on file about the borrower.
   *
   * Name, contact, current address and previous addresses were four separate
   * cards, half the page, above the figures a borrower opens this tab to read.
   * It is verification data - worth being able to check, not worth being read
   * first - so it is one panel, and it starts closed.
   *
   * The SSN is masked. It arrives masked from the API and is masked again here:
   * this is a screen a borrower may well be sharing when they open it.
   */
  describe('identity held on file', () => {
    const personalInfo = {
      name: 'Jane Okafor',
      dob: '1984-03-22',
      ssn: 'XXX-XX-4821',
      email: 'jane@example.com',
      phone: '555-0142' as string | null,
    }

    const addresses = [
      {
        type: 'CURRENT',
        street: '12 Bridge St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        date_reported: '2024-01-05',
      },
      {
        type: 'PREVIOUS',
        street: '8 Mill Rd',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        date_reported: '2019-06-18',
      },
    ] as never

    it('starts closed so the figures are what the tab opens on', () => {
      renderWithProviders(
        <CreditIdentityPanel personalInfo={personalInfo as never} addresses={addresses} />,
      )

      expect(screen.queryByText('Jane Okafor')).not.toBeInTheDocument()
    })

    it('names what is inside without being opened', () => {
      renderWithProviders(
        <CreditIdentityPanel personalInfo={personalInfo as never} addresses={addresses} />,
      )

      expect(screen.getByRole('button', { name: /identity on file/i })).toBeInTheDocument()
    })

    it('shows the identity and contact details once opened', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CreditIdentityPanel personalInfo={personalInfo as never} addresses={addresses} />,
      )

      await user.click(screen.getByRole('button', { name: /identity on file/i }))

      expect(screen.getByText('Jane Okafor')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      expect(screen.getByText('555-0142')).toBeInTheDocument()
    })

    it('separates the current address from the previous ones', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CreditIdentityPanel personalInfo={personalInfo as never} addresses={addresses} />,
      )

      await user.click(screen.getByRole('button', { name: /identity on file/i }))

      expect(screen.getByText(/12 Bridge St/)).toBeInTheDocument()
      expect(screen.getByText(/8 Mill Rd/)).toBeInTheDocument()
      expect(screen.getByText(/previous/i)).toBeInTheDocument()
    })

    it('masks the SSN until the borrower asks for it', async () => {
      const user = userEvent.setup()
      const { container } = renderWithProviders(
        <CreditIdentityPanel
          personalInfo={{ ...personalInfo, ssn: '123-45-4821' } as never}
          addresses={addresses}
        />,
      )

      await user.click(screen.getByRole('button', { name: /identity on file/i }))

      expect(screen.getByText('***-**-4821')).toBeInTheDocument()
      expect(container.textContent).not.toContain('123-45')
    })

    it('reveals the full SSN on a deliberate click, and hides it again', async () => {
      // It is the borrower's own number, so it stays reachable - but never by
      // default, and never without the panel being opened first.
      const user = userEvent.setup()
      renderWithProviders(
        <CreditIdentityPanel
          personalInfo={{ ...personalInfo, ssn: '123-45-4821' } as never}
          addresses={addresses}
        />,
      )

      await user.click(screen.getByRole('button', { name: /identity on file/i }))
      await user.click(screen.getByRole('button', { name: /reveal/i }))

      expect(screen.getByText('123-45-4821')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /hide/i }))

      expect(screen.getByText('***-**-4821')).toBeInTheDocument()
    })

    it('keeps the SSN out of the document entirely while closed', async () => {
      // Collapsed, the digits are not merely hidden by CSS - they are not
      // rendered, so nothing on screen or in the DOM carries them.
      const { container } = renderWithProviders(
        <CreditIdentityPanel
          personalInfo={{ ...personalInfo, ssn: '123-45-4821' } as never}
          addresses={addresses}
        />,
      )

      expect(container.textContent).not.toContain('4821')
    })

    it('survives a profile with no identity data at all', () => {
      expect(() =>
        renderWithProviders(
          <CreditIdentityPanel personalInfo={undefined as never} addresses={undefined as never} />,
        ),
      ).not.toThrow()
    })
  })

  /**
   * The request form, which is what actually triggers an FCRA credit pull.
   *
   * The two fields the pull is keyed on had no client-side check at all, and on
   * the server `ssn` was `required|string|max:255` - a rule that accepts "abc".
   * A borrower could submit a malformed SSN, wait, and get a 422 back for the
   * one field they cannot easily re-read off a screen.
   *
   * Both checks now match the server's Ssn and UsPostalCode rules, including
   * the SSA exclusions, so the two cannot drift apart without a test saying so.
   */
  describe('the request form', () => {
    afterEach(() => {
      server.resetHandlers()
      useAuthStore.setState({
        token: undefined,
        user: null,
        userSubscription: null,
        rememberMe: true,
      })
      vi.restoreAllMocks()
    })

    /** No profile and no prior request, so the tab shows the empty form. */
    const serveEmpty = (personalInfo: Record<string, unknown> | null = null) =>
      server.use(
        http.get('*/borrower/profile/credit-profile', () =>
          HttpResponse.json({ status: true, data: null })
        ),
        http.get('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json({ status: true, data: [] })
        ),
        http.get('*/borrower/profile/personal-info', () =>
          HttpResponse.json({ status: true, data: personalInfo })
        )
      )

    /**
     * Both FCRA consents, then submit. The button is disabled without them -
     * deliberately - so every submission path goes through here.
     */
    const consentThenSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      for (const box of screen.getAllByRole('checkbox')) {
        if (!(box as HTMLInputElement).checked) await user.click(box)
      }
      await user.click(screen.getByRole('button', { name: /submit credit profile/i }))
    }

    const openForm = async () => {
      resetAuth()
      serveEmpty()
      renderTab()
      return await screen.findByLabelText(/social security number/i)
    }

    describe('coming back to the tab', () => {
      // A request submitted but not yet verified (credit_profile_updated still
      // false) used to show the empty form again on every visit.
      beforeEach(() => vi.mocked(toast.error).mockClear())

      const awaitingVerification = () =>
        useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: false }, userSubscription: null, rememberMe: true })

      it('shows a request already submitted, awaiting its results', async () => {
        awaitingVerification()
        server.use(
          http.get('*/borrower/profile/credit-profile-request', () =>
            HttpResponse.json({ status: true, data: { id: 5, first_name: 'Odessa', last_name: 'Mccall', ssn: '123456789' } })
          )
        )
        renderTab()

        expect(await screen.findByText(/submitted · awaiting results/i)).toBeInTheDocument()
        expect(screen.getByText(/credit profile submitted/i)).toBeInTheDocument()
      })

      it('says it was submitted, and that the details can still be updated and submitted again', async () => {
        awaitingVerification()
        server.use(
          http.get('*/borrower/profile/credit-profile-request', () =>
            HttpResponse.json({ status: true, data: { id: 5, first_name: 'Odessa', last_name: 'Mccall', ssn: '123456789', created_at: '2026-10-08T09:30:00Z' } })
          )
        )
        renderTab()

        const section = await screen.findByRole('status', { name: /credit profile submitted/i })
        expect(section).toHaveTextContent(/our team is verifying it/i)
        expect(section).toHaveTextContent(/update your details below and submit again/i)
        expect(section).toHaveTextContent(/submitted on oct 8, 2026/i)
        // The form is still there to edit, and its button now says what it does.
        expect(screen.getByDisplayValue('Odessa')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /resubmit credit profile/i })).toBeInTheDocument()
      })

      it('says nothing of an earlier submission, and offers a plain Submit, before anything is in', async () => {
        awaitingVerification()
        server.use(
          http.get('*/borrower/profile/credit-profile-request', () => HttpResponse.json({ status: true, data: [] }))
        )
        renderTab()

        expect(await screen.findByRole('button', { name: /^submit credit profile$/i })).toBeInTheDocument()
        expect(screen.queryByRole('status', { name: /credit profile submitted/i })).toBeNull()
      })

      it('shows the empty form when nothing has been submitted yet', async () => {
        awaitingVerification()
        server.use(
          http.get('*/borrower/profile/credit-profile-request', () => HttpResponse.json({ status: true, data: [] }))
        )
        renderTab()

        expect(await screen.findByText(/^not submitted$/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /submit credit profile/i })).toBeInTheDocument()
      })

      it('falls back to the form, without an error toast, if the earlier request cannot be loaded', async () => {
        awaitingVerification()
        server.use(
          http.get('*/borrower/profile/credit-profile-request', () =>
            HttpResponse.json({ status: false, message: 'Server error' }, { status: 500 })
          )
        )
        renderTab()

        expect(await screen.findByRole('button', { name: /submit credit profile/i })).toBeInTheDocument()
        expect(toast.error).not.toHaveBeenCalled()
      })
    })

    describe('pre-filled from the profile on file', () => {
      // The borrower has already given us these on the Personal Info tab, so the
      // form arrives filled in for them to check and submit.
      const onFile = {
        id: 1,
        first_name: 'Odessa',
        middle_name: 'Rae',
        last_name: 'Mccall',
        email: 'odessa@example.test',
        home_address: '1 Main St',
        city: 'Austin',
        state: 'Texas',
        zip_code: '78701',
        country: 'United States',
        phone_number: '5125550100',
        home_phone: '',
        last_4_ssn: '6789',
        date_of_birth: '1986-09-01',
      }

      const openPrefilled = async (personalInfo: Record<string, unknown> | null = onFile) => {
        const { countries } = await import('../../../../src/modules/location')
        countries.splice(0, countries.length, {
          name: 'United States', code: 'US', currency: 'USD', phone_code: '+1', flag: '',
          states: [{ name: 'Texas', code: 'TX', cities: [] }],
        })
        resetAuth()
        serveEmpty(personalInfo)
        renderTab()
        await screen.findByLabelText(/social security number/i)
      }

      afterEach(async () => {
        const { countries } = await import('../../../../src/modules/location')
        countries.splice(0, countries.length)
      })

      const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement

      it('fills in the name, address, phone and email from the profile', async () => {
        await openPrefilled()

        await waitFor(() => expect(screen.getByDisplayValue('Odessa')).toBeInTheDocument())
        expect(screen.getByDisplayValue('Rae')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Mccall')).toBeInTheDocument()
        expect(screen.getByDisplayValue('1 Main St')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Austin')).toBeInTheDocument()
        expect(field(/zip code/i).value).toBe('78701')
        expect(screen.getByDisplayValue('(512) 555-0100')).toBeInTheDocument()
        expect(screen.getByDisplayValue('odessa@example.test')).toBeInTheDocument()
      })

      it('selects the state and the date of birth too', async () => {
        await openPrefilled()

        expect(await screen.findByText('Texas')).toBeInTheDocument()
        await waitFor(() => expect(screen.getByDisplayValue('1986-09-01')).toBeInTheDocument())
      })

      it('leaves the full SSN to the borrower, since only the last four are on file', async () => {
        await openPrefilled()

        await waitFor(() => expect(screen.getByDisplayValue('Odessa')).toBeInTheDocument())
        expect(field(/social security number/i).value).toBe('')
        expect(screen.getByText(/ending in 6789/i)).toBeInTheDocument()
      })

      it('can be corrected before submitting', async () => {
        const user = userEvent.setup()
        await openPrefilled()
        const city = await screen.findByDisplayValue('Austin')

        await user.clear(city)
        await user.type(city, 'Dallas')

        expect((city as HTMLInputElement).value).toBe('Dallas')
      })

      it('does not overwrite what the borrower has already typed', async () => {
        const user = userEvent.setup()
        resetAuth()
        const { countries } = await import('../../../../src/modules/location')
        countries.splice(0, countries.length)
        let release: () => void = () => {}
        const gate = new Promise<void>((resolve) => (release = resolve))
        server.use(
          http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: null })),
          http.get('*/borrower/profile/credit-profile-request', () => HttpResponse.json({ status: true, data: [] })),
          http.get('*/borrower/profile/personal-info', async () => {
            await gate
            return HttpResponse.json({ status: true, data: onFile })
          })
        )
        renderTab()
        const ssn = await screen.findByLabelText(/social security number/i)
        const city = screen.getByPlaceholderText('New York')

        await user.type(city, 'Reno')
        release()

        await waitFor(() => expect(screen.getByDisplayValue('Odessa')).toBeInTheDocument())
        expect((city as HTMLInputElement).value).toBe('Reno')
        expect((ssn as HTMLInputElement).value).toBe('')
      })

      it('still shows an empty form when there is no profile to copy from', async () => {
        await openPrefilled(null)

        expect(field(/social security number/i).value).toBe('')
        expect(screen.getByPlaceholderText('New York')).toHaveValue('')
      })
    })

    it('writes the SSN as the borrower types it', async () => {
      // The placeholder promised XXX-XX-XXXX and the field did nothing of the
      // sort - formatSSN existed and was tested, just never wired up here.
      const user = userEvent.setup()
      const ssn = await openForm()

      await user.type(ssn, '123456789')

      await waitFor(() => expect((ssn as HTMLInputElement).value).toBe('123-45-6789'))
    })

    it('refuses a short SSN without asking the server', async () => {
      let posted = false
      const user = userEvent.setup()
      const ssn = await openForm()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () => {
          posted = true
          return HttpResponse.json({ status: true, message: 'ok' })
        })
      )

      await user.type(ssn, '12345')
      await consentThenSubmit(user)

      expect(await screen.findByText(/valid 9-digit SSN/i)).toBeInTheDocument()
      expect(posted).toBe(false)
    })

    it('refuses a combination the SSA never issues', async () => {
      // Parity with the server's Ssn rule. Nine digits is not enough to be an
      // SSN, and finding that out from a 422 helps nobody.
      let posted = false
      const user = userEvent.setup()
      const ssn = await openForm()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () => {
          posted = true
          return HttpResponse.json({ status: true, message: 'ok' })
        })
      )

      await user.type(ssn, '666456789')
      await consentThenSubmit(user)

      expect(await screen.findByText(/valid 9-digit SSN/i)).toBeInTheDocument()
      expect(posted).toBe(false)
    })

    it('refuses a short ZIP without asking the server', async () => {
      let posted = false
      const user = userEvent.setup()
      await openForm()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () => {
          posted = true
          return HttpResponse.json({ status: true, message: 'ok' })
        })
      )

      await user.type(screen.getByLabelText(/zip code/i), '787')
      await consentThenSubmit(user)

      expect(await screen.findByText(/5-digit ZIP/i)).toBeInTheDocument()
      expect(posted).toBe(false)
    })

    it('reports a validation problem on the field, never as a toast', async () => {
      // A toast for a field error is the wrong channel twice over: it covers
      // part of the form, and it disappears before the borrower has finished
      // correcting the field it was about. The message belongs where the
      // mistake is.
      const user = userEvent.setup()
      const ssn = await openForm()

      await user.type(ssn, '12345')
      await consentThenSubmit(user)

      expect(await screen.findByText(/valid 9-digit SSN/i)).toBeInTheDocument()
      expect(toast.error).not.toHaveBeenCalled()
    })

    it('does not toast a validation error the server sent back either', async () => {
      // Same rule whichever side found the problem. The server's 422 is mapped
      // onto the fields, so a toast would just repeat what is already there.
      const user = userEvent.setup()
      const ssn = await openForm()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json(
            { status: false, message: 'The given data was invalid.', errors: { email: ['Enter a valid email.'] } },
            { status: 422 }
          )
        )
      )

      await user.type(ssn, '123456789')
      await user.type(screen.getByLabelText(/zip code/i), '78701')
      await consentThenSubmit(user)

      expect(await screen.findByText(/Enter a valid email/i)).toBeInTheDocument()
      expect(toast.error).not.toHaveBeenCalled()
    })

    it('posts the SSN as the nine digits, not as it was written', async () => {
      // The server normalises too, but sending the written form would mean the
      // pull is keyed on whichever shape happened to arrive.
      let body: Record<string, unknown> | null = null
      const user = userEvent.setup()
      const ssn = await openForm()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ status: true, message: 'ok' })
        })
      )

      await user.type(ssn, '123456789')
      await user.type(screen.getByLabelText(/zip code/i), '78701')
      await consentThenSubmit(user)

      await waitFor(() => expect(body).not.toBeNull())
      expect(body).toMatchObject({ ssn: '123456789' })
    })

    it('tells the Getting Started walkthrough the credit profile was submitted', async () => {
      // The next-step suggestion reads the borrower's step from the profile
      // completion response - a successful submit has to mark it stale, or it
      // keeps telling the borrower to fill in a form they just sent.
      const user = userEvent.setup()
      resetAuth()
      serveEmpty()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json({ status: true, message: 'ok' })
        )
      )
      const queryClient = createTestQueryClient()
      queryClient.setQueryData(queryKeys.profile.completion(), { status: true, data: null })
      render(
        <QueryClientProvider client={queryClient}>
          <CreditProfileTab />
        </QueryClientProvider>,
      )

      await user.type(await screen.findByLabelText(/social security number/i), '123456789')
      await user.type(screen.getByLabelText(/zip code/i), '78701')
      await consentThenSubmit(user)

      await waitFor(() =>
        expect(queryClient.getQueryState(queryKeys.profile.completion())?.isInvalidated).toBe(true)
      )
    })

    it('tells the page once the request is in, so it can move the borrower on', async () => {
      // A funding-only borrower's next step is Documents; the profile page
      // takes them there (see Profile).
      const user = userEvent.setup()
      resetAuth()
      serveEmpty()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json({ status: true, message: 'ok' })
        )
      )
      const onSubmitted = vi.fn()
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreditProfileTab onSubmitted={onSubmitted} />
        </QueryClientProvider>,
      )

      await user.type(await screen.findByLabelText(/social security number/i), '123456789')
      await user.type(screen.getByLabelText(/zip code/i), '78701')
      await consentThenSubmit(user)

      await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1))
    })

    it('does not move the borrower on again when they submit a request they already had in', async () => {
      // Editing and resubmitting stays on the page: the walkthrough move (to
      // the Step-By-Step Guide) is for the first submission only.
      const user = userEvent.setup()
      useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: false }, userSubscription: null, rememberMe: true })
      let posts = 0
      server.use(
        http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: null })),
        http.get('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json({ status: true, data: { id: 5, first_name: 'Odessa', last_name: 'Mccall', ssn: '123456789', zip: '78701' } })
        ),
        http.post('*/borrower/profile/credit-profile-request', () => {
          posts++
          return HttpResponse.json({ status: true, message: 'ok' })
        })
      )
      const onSubmitted = vi.fn()
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreditProfileTab onSubmitted={onSubmitted} />
        </QueryClientProvider>,
      )

      await screen.findByText(/submitted · awaiting results/i)
      await consentThenSubmit(user)

      await waitFor(() => expect(posts).toBe(1))
      await new Promise((r) => setTimeout(r, 100))
      expect(onSubmitted).not.toHaveBeenCalled()
    })

    it('brings the submitted notice into view after resubmitting, since the form is long', async () => {
      const user = userEvent.setup()
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: false }, userSubscription: null, rememberMe: true })
      server.use(
        http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: null })),
        http.get('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json({ status: true, data: { id: 5, first_name: 'Odessa', last_name: 'Mccall', ssn: '123456789', zip: '78701' } })
        ),
        http.post('*/borrower/profile/credit-profile-request', () => HttpResponse.json({ status: true, message: 'ok' }))
      )
      renderTab()

      await screen.findByText(/submitted · awaiting results/i)
      // Opening the tab on a submitted request doesn't scroll anywhere.
      expect(scrollIntoView).not.toHaveBeenCalled()
      await consentThenSubmit(user)

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
      const notice = screen.getByRole('status', { name: /credit profile submitted/i })
      expect(scrollIntoView.mock.contexts[0]).toBe(notice)
      delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
    })

    it('does not move the borrower on when the request is refused', async () => {
      const user = userEvent.setup()
      resetAuth()
      serveEmpty()
      server.use(
        http.post('*/borrower/profile/credit-profile-request', () =>
          HttpResponse.json({ message: 'Invalid', errors: { email: ['Enter a valid email'] } }, { status: 422 })
        )
      )
      const onSubmitted = vi.fn()
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <CreditProfileTab onSubmitted={onSubmitted} />
        </QueryClientProvider>,
      )

      await user.type(await screen.findByLabelText(/social security number/i), '123456789')
      await user.type(screen.getByLabelText(/zip code/i), '78701')
      await consentThenSubmit(user)

      expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
      expect(onSubmitted).not.toHaveBeenCalled()
    })
  })
  /**
   * The redesigned request form: every field is labelled, and the form says
   * where the borrower's request stands before they read any of it.
   */
  describe('the request form layout', () => {
    afterEach(() => {
      server.resetHandlers()
      useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
      vi.restoreAllMocks()
    })

    const serve = (creditProfile: unknown) =>
      server.use(
        http.get('*/borrower/profile/credit-profile', () => HttpResponse.json({ status: true, data: creditProfile })),
        http.get('*/borrower/profile/credit-profile-request', () => HttpResponse.json({ status: true, data: [] }))
      )

    it('ties every field to its label', async () => {
      useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: false }, userSubscription: null, rememberMe: true })
      serve(null)
      renderTab()
      await screen.findByLabelText(/social security number/i)

      for (const label of [/first name/i, /middle name/i, /last name/i, /date of birth/i, /phone number/i, /email address/i, /street address/i, /apt \/ suite/i, /^city/i]) {
        expect(screen.getByLabelText(label)).toBeInstanceOf(HTMLInputElement)
      }
    })

    it('says a request has not been sent yet', async () => {
      useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: false }, userSubscription: null, rememberMe: true })
      serve(null)
      renderTab()

      expect(await screen.findByTestId('cp-request-status')).toHaveTextContent(/not submitted/i)
    })

    it('says a request is waiting on results when one was sent but not yet pulled', async () => {
      // credit_profile_updated with no bureau data back: the endpoint returns the
      // request the borrower sent (no personal_info), not a credit profile.
      useAuthStore.setState({ token: 'tok', user: { id: 1, credit_profile_updated: true }, userSubscription: null, rememberMe: true })
      serve({ first_name: 'Odessa', last_name: 'Mccall', address: '1 Main St', city: 'Austin', state: 'Texas', zip: '78701', ssn: '', date_of_birth: '1986-09-01', phone: '', email: '' })
      renderTab()

      const status = await screen.findByTestId('cp-request-status')
      expect(status).toHaveTextContent(/submitted/i)
      expect(status).not.toHaveTextContent(/not submitted/i)
    })
  })
})
