import { test, expect, pageHeading } from '../../support/fixtures'

// The dashboard's colours, read from the computed styles the borrower gets.
// Navy on white for the figures and cards; colour where it should catch the
// eye: the hero (kept as designed), the approved requests ready to process,
// the "Need Help?" strip and the approved-funding banner under the topbar.
const approved = [
  { id: 7, requested_amount: '45000', estimated_funding_range: '$45,000', funding_type: 'Term Loan' },
  { id: 6, requested_amount: '12000', estimated_funding_range: '$12,000', funding_type: 'Line of Credit' },
]

test.describe('Sidebar › Dashboard › palette', () => {
  test.beforeEach(async ({ page }) => {
    // Two approved requests waiting, whatever the borrower's real state, so the
    // banner and the Ready to Process card are on screen. Read-only.
    await page.route('**/borrower/active-funding-requests', (route) =>
      route.fulfill({
        json: {
          status: true,
          message: 'ok',
          data: {
            active_approved_funding_requests: approved,
            active_approved_funding_request: approved[0],
            active_approved_funding_request_count: approved.length,
          },
        },
      })
    )
    await page.goto('/')
    await expect(pageHeading(page, /^Welcome back,/)).toBeVisible()
  })

  const style = (locator: import('@playwright/test').Locator) =>
    locator.evaluate((el) => {
      const s = getComputedStyle(el)
      return { backgroundImage: s.backgroundImage, backgroundColor: s.backgroundColor, color: s.color, fontSize: s.fontSize }
    })

  test('the four totals are white cards with dark figures, not gradient tiles', async ({ page }) => {
    const kpis = page.locator('.page-content [data-kpi]')
    await expect(kpis).toHaveCount(4)
    for (const kpi of await kpis.all()) {
      const s = await style(kpi)
      expect(s.backgroundImage).toBe('none')
      expect(s.backgroundColor).toBe('rgb(255, 255, 255)')
      expect(s.color).not.toBe('rgb(255, 255, 255)')
    }
  })

  test('card icons carry no gradient', async ({ page }) => {
    for (const icon of await page.locator('.page-content .db-card-icon').all()) {
      expect((await style(icon)).backgroundImage).toBe('none')
    }
  })

  test('the help strip is colourful', async ({ page }) => {
    const support = page.locator('.page-content [data-widget="support"]')
    await expect(support).toBeVisible()
    const s = await style(support)
    expect(s.backgroundImage).toContain('linear-gradient')
    expect(s.color).toBe('rgb(255, 255, 255)')
  })

  test('the requests ready to process have a light green tint and dark text', async ({ page }) => {
    const card = page.locator('.page-content [data-widget="approved-request"]')
    await expect(card).toBeVisible()
    const s = await style(card)
    expect(s.backgroundImage).toContain('linear-gradient')
    expect(s.backgroundImage).not.toContain('rgb(6, 142, 119)') // not the deep green
    expect(s.color).not.toBe('rgb(255, 255, 255)')
    // Only its green left edge, no border around it.
    const edges = await card.evaluate((el) => {
      const c = getComputedStyle(el)
      return { top: c.borderTopWidth, right: c.borderRightWidth, bottom: c.borderBottomWidth, left: c.borderLeftWidth }
    })
    expect(edges).toEqual({ top: '0px', right: '0px', bottom: '0px', left: '4px' })

    // Prev / Next stand out from the tint: white on solid green.
    for (const name of [/Prev/, /Next/]) {
      const button = card.getByRole('button', { name })
      await expect(button).toBeVisible()
      const b = await style(button)
      expect(b.color).toBe('rgb(255, 255, 255)')
      expect(b.backgroundColor).toBe('rgb(6, 142, 119)')
    }
  })

  test('credit score and tier are two cards with a gap between them', async ({ page }) => {
    const score = await page.locator('.page-content [data-widget="credit-score"]').boundingBox()
    const tier = await page.locator('.page-content [data-widget="tier"]').boundingBox()
    expect(score && tier).toBeTruthy()
    expect(tier!.x - (score!.x + score!.width)).toBeGreaterThanOrEqual(12)
  })

  test('the approved-funding banner is one light, compact line under the topbar', async ({ page }) => {
    const banner = page.getByRole('alert').filter({ hasText: 'You have 2 Funding Requests Approved!' })
    await expect(banner).toBeVisible()
    const s = await style(banner)
    expect(s.backgroundImage).toContain('linear-gradient')
    expect(s.color).not.toBe('rgb(255, 255, 255)') // dark text on a light tint
    expect(parseFloat((await style(banner.locator('.gfb-title'))).fontSize)).toBeLessThanOrEqual(14)
    const height = (await banner.boundingBox())!.height
    expect(height).toBeGreaterThanOrEqual(50)
    expect(height).toBeLessThanOrEqual(60)
    expect(await banner.evaluate((el) => getComputedStyle(el).borderBottomWidth)).toBe('0px')
    // The icon keeps a solid colour, so the strip still catches the eye.
    expect((await style(banner.locator('.gfb-icon'))).backgroundColor).toBe('rgb(10, 179, 156)')
    // Where its button leads is covered by GlobalFundingBanner.test.tsx: the
    // requests here are stand-ins, with no real application behind them.
    await expect(banner.getByRole('button', { name: /Start Funding Application/ })).toBeVisible()
  })

  test('long meeting and invoice lists scroll inside compact cards, invoices as plain rows', async ({ page }) => {
    // More than fit: the real dashboard response with 8 of each in place of the
    // borrower's own (read-only).
    const meetings = Array.from({ length: 8 }, (_, i) => ({
      id: 900 + i, subject: `Meeting ${i + 1}`, status: 'Scheduled', meeting_type: 'Zoom',
      appointment_date: `2026-11-${String(i + 2).padStart(2, '0')}T10:00:00`, formatted_appointment_date: '',
      scheduled_by: null, assigned_for: null,
    }))
    const invoices = Array.from({ length: 8 }, (_, i) => ({
      id: 800 + i, invoice_id: `INV-E2E-${i + 1}`, status: i % 2 ? 'Paid' : 'Unpaid', payment_amount: '100',
      payment_date: '', currency: 'USD', currency_symbol: '$', conversion_rate: '1', created_at: '', formatted_created_at: '',
    }))
    await page.route('**/borrower/dashboard', async (route) => {
      const res = await route.fetch()
      const body = await res.json()
      body.data.upcoming_meeting = meetings
      body.data.invoices = invoices
      await route.fulfill({ response: res, json: body })
    })
    await page.reload()

    for (const [widget, list] of [['meetings', '.db-meetings'], ['invoices', '.db-invoices']]) {
      const card = page.locator(`.page-content [data-widget="${widget}"]`)
      await expect(card.locator(`${list} > li`)).toHaveCount(8)
      const scroll = await card.locator(list).evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }))
      expect(scroll.scroll, `${widget} list scrolls`).toBeGreaterThan(scroll.client)
      expect((await card.boundingBox())!.height, `${widget} card height`).toBeLessThanOrEqual(460)
    }

    // Invoice rows: plain, divided by a line, and the same height as the meeting rows beside them.
    const row = page.locator('.page-content [data-widget="invoices"] .db-invoice').nth(1)
    const r = await row.evaluate((el) => {
      const c = getComputedStyle(el)
      return { bg: c.backgroundColor, left: c.borderLeftWidth, top: c.borderTopWidth }
    })
    expect(r).toEqual({ bg: 'rgba(0, 0, 0, 0)', left: '0px', top: '1px' })
    const invoiceRow = (await row.boundingBox())!.height
    const meetingRow = (await page.locator('.page-content [data-widget="meetings"] .db-meeting').nth(1).boundingBox())!.height
    expect(Math.abs(invoiceRow - meetingRow)).toBeLessThanOrEqual(3)
  })

  test('every gap between blocks is the same, across and down', async ({ page }) => {
    await expect(page.locator('.page-content [data-widget="support"]')).toBeVisible()
    const gaps = await page.evaluate(() => {
      const box = (el: Element) => el.getBoundingClientRect()
      const across = (selectors: string[]) => {
        const els = selectors.map((s) => document.querySelector(s)).filter((e): e is Element => !!e)
        return els.slice(1).map((el, i) => Math.round(box(el).left - box(els[i]).right))
      }
      const kpis = Array.from(document.querySelectorAll('.db-page [data-kpi]'))
      const down = ['.db-hero', '.db-kpis', '[data-widget="approved-request"]', '[data-widget="credit-score"]', '[data-widget="pre-qualifications"]', '[data-widget="support"]']
        .map((s) => document.querySelector(`.db-page ${s}`))
        .filter((e): e is Element => !!e)
      return {
        kpis: kpis.slice(1).map((el, i) => Math.round(box(el).left - box(kpis[i]).right)),
        cards: across(['[data-widget="credit-score"]', '[data-widget="tier"]', '[data-widget="meetings"]', '[data-widget="invoices"]']),
        tables: across(['[data-widget="pre-qualifications"]', '[data-widget="funding-applications"]']),
        down: down.slice(1).map((el, i) => Math.round(box(el).top - box(down[i]).bottom)),
      }
    })
    for (const [where, list] of Object.entries(gaps)) {
      expect(list.length, where).toBeGreaterThan(0)
      for (const g of list) expect(g, where).toBe(16)
    }
  })

  test('the hero keeps its design', async ({ page }) => {
    expect((await style(page.locator('.page-content .db-hero'))).backgroundImage).toContain('linear-gradient')
  })
})
