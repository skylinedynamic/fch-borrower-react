import { test, expect, openFromSidebar } from '../../support/fixtures'

// BUG-187: the Current / Recent Bill card showed the invoice's timestamp shifted
// into the viewer's timezone, so for a viewer ahead of UTC an invoice made in
// the UTC evening read one day later than on the invoice itself. Run as a
// browser in Dhaka (UTC+6, where QA saw it); the card must show the same date
// as the invoice it links to. Read-only.
test.use({ timezoneId: 'Asia/Dhaka' })

test.describe('Sidebar › Billing Details › Current / Recent Bill', () => {
  test('shows the same date as the invoice it links to', async ({ page }) => {
    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)

    const card = page.locator('.billing-card-wrapper').filter({ hasText: 'Current / Recent Bill' })
    await expect(card.locator('.billing-card-amount, :text("No recent bill found.")').first()).toBeVisible()
    const viewInvoice = card.getByRole('link', { name: /view invoice/i })
    test.skip((await viewInvoice.count()) === 0, 'this borrower has no invoice yet')

    const cardDate = (await card.locator('span', { hasText: /^Date:/ }).locator('strong').innerText()).trim()
    expect(cardDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    await viewInvoice.first().click()
    await expect(page).toHaveURL(/\/invoices\/\d+$/)
    await expect(page.getByText('Invoice Date:')).toContainText(`Invoice Date: ${cardDate}`)
  })
})
