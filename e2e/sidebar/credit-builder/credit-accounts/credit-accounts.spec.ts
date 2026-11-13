import { test, expect, pageHeading, sidebar } from '../../../support/fixtures'

test.describe('Sidebar › Credit Builder › Credit Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await sidebar(page).getByRole('button', { name: /Credit Builder/ }).click()
    const link = page.locator('#creditBuilderMenu a', { hasText: 'Credit Accounts' })
    await link.click()
    await expect(page).toHaveURL(/\/credit-builder\/credit-accounts$/)
    await expect(link).toHaveClass(/active/)
  })

  test('shows the accounts catalogue with its filters', async ({ page }) => {
    await expect(pageHeading(page, 'Credit Accounts')).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Categories' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Issuers' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search accounts' })).toBeVisible()
  })

  test('opens with the brand hero, then either the cards or the tier lock', async ({ page }) => {
    const hero = page.getByRole('region', { name: 'Credit Accounts' })
    await expect(hero.getByText('Accounts available')).toBeVisible()
    await expect(hero.getByText('Your tier')).toBeVisible()

    const firstCard = page.locator('article.ca-card').first()
    const locked = page.getByRole('heading', { name: 'Credit accounts are locked' })
    const empty = page.getByRole('heading', { name: 'No matching accounts' })
    await expect(firstCard.or(locked).or(empty)).toBeVisible()

    if (await firstCard.isVisible()) {
      await expect(firstCard.getByRole('link', { name: /Apply now/i })).toHaveAttribute('target', '_blank')
      // BUG-028, by design: every status is offered whatever the current one is.
      await firstCard.getByRole('button', { name: /Mark status/i }).click()
      await expect(page.getByRole('menu', { name: 'Mark as' }).getByRole('menuitemradio')).toHaveText(['Requested', 'Processing', 'Approved'])
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu', { name: 'Mark as' })).toHaveCount(0)
    }
  })

  // The page wrapper once shared its class with the pagination buttons and was
  // held to 36px: the content spilled out, the footer floated over the cards and
  // the white page background showed as a strip under the top bar.
  test('grows with its cards, so the footer sits below the last one; four cards to a row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const cards = page.locator('article.ca-card')
    await expect(cards.first().or(page.getByRole('heading', { name: 'Credit accounts are locked' }))).toBeVisible()
    test.skip(await cards.count() === 0, 'the E2E borrower has no accounts on offer')

    const last = await cards.last().boundingBox()
    const footer = await page.locator('footer.footer').boundingBox()
    // ...with a clear gap, not touching it.
    expect(footer!.y - (last!.y + last!.height)).toBeGreaterThanOrEqual(20)

    if (await cards.count() >= 4) {
      const tops = await cards.evaluateAll((els) => els.slice(0, 5).map((e) => Math.round(e.getBoundingClientRect().top)))
      expect(tops.slice(0, 4).every((t) => t === tops[0])).toBe(true)
      if (tops.length === 5) {
        expect(tops[4]).toBeGreaterThan(tops[0])
        // Rows are the grid gap apart (20px), not that plus a global article margin.
        const firstRowBottom = await cards.first().evaluate((e) => Math.round(e.getBoundingClientRect().bottom))
        expect(tops[4] - firstRowBottom).toBeLessThanOrEqual(21)
      }
    }
  })

  // A tall card image (WEX FlexCard) once rendered at its natural size and
  // spilled over the issuer, name and tiles: the image box is a grid whose row
  // was sized to its content, so the image's max-height: 100% had nothing to
  // resolve against.
  // The wider the card, the taller the image, so it is checked at a three-card
  // width as well as four.
  test('keeps every card image inside its image box', async ({ page }) => {
    const cards = page.locator('article.ca-card')
    await expect(cards.first().or(page.getByRole('heading', { name: 'Credit accounts are locked' }))).toBeVisible()
    const images = page.locator('article.ca-card .ca-card-image')
    test.skip(await images.count() === 0, 'no account on offer has a card image')
    await images.evaluateAll((els) => Promise.all(els.map((img) => (img as HTMLImageElement).decode().catch(() => undefined))))

    for (const width of [1200, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const spills = await images.evaluateAll((els) => els
        .filter((img) => (img as HTMLImageElement).naturalWidth > 0)
        .map((img) => {
          const box = img.closest('.ca-card-visual')!.getBoundingClientRect()
          const r = img.getBoundingClientRect()
          return { src: (img as HTMLImageElement).src, over: Math.round(Math.max(box.top - r.top, r.bottom - box.bottom, box.left - r.left, r.right - box.right)) }
        })
        .filter((s) => s.over > 1))
      expect(spills, `at ${width}px`).toEqual([])
    }
  })

  test('has no sideways scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('region', { name: 'Credit Accounts' })).toBeVisible()
    await expect(page.locator('article.ca-card').first()
      .or(page.getByRole('heading', { name: 'Credit accounts are locked' }))
      .or(page.getByRole('heading', { name: 'No matching accounts' }))).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
