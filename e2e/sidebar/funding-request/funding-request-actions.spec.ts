import { test, expect, pageHeading } from '../../support/fixtures'

// QA (borrowers…/funding-requests): Edit Application was out of line with the
// other actions. Cause: custom.min.css gives every .btn-warning extra vertical
// padding, so the small yellow button was 33px tall against 27px. A row whose
// application is submitted but still editable shows three actions - Details,
// Edit Application, View Application - and they must sit on one line.
//
// Whether the local borrower has such a request depends on the database, so the
// list answer is replaced with one; the page, styles and layout are real.
const editableRow = {
  id: 38,
  funding_type: 'Business Line of Credit',
  funding_sequence: { id: 3, name: 'Business Lines of Credit' },
  requested_amount: 70000,
  use_of_funds: 'Working Capital',
  status: 'Approved',
  application_status: 'Pending',
  application_is_editable: true,
  funding_application_id: 82,
  created_at: '2026-10-14T18:09:00Z',
}

test.describe('Sidebar › Funding Request › row actions', () => {
  test('Edit Application lines up with the other actions inside the Actions cell', async ({ page }) => {
    await page.route('**/borrower/funding/requests/list', (route) =>
      route.fulfill({ json: { status: true, message: 'ok', data: [editableRow], meta: { total: 1, current_page: 1, last_page: 1, per_page: 10 }, funding_types: [] } })
    )
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.goto('/funding-requests')
    await expect(pageHeading(page, 'Funding Requests')).toBeVisible()

    const row = page.getByRole('row', { name: /Business Line of Credit/ })
    const actions = [
      row.getByRole('button', { name: /details/i }),
      row.getByRole('link', { name: /edit application/i }),
      row.getByRole('link', { name: /view application/i }),
    ]
    for (const action of actions) await expect(action).toBeVisible()

    const boxes = await Promise.all(actions.map((a) => a.boundingBox()))
    const cell = await row.locator('td').last().boundingBox()

    // Same line, same height.
    for (const box of boxes) {
      expect(Math.abs(box!.y - boxes[0]!.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(box!.height - boxes[0]!.height)).toBeLessThanOrEqual(1)
    }
    // Nothing spills out of the cell.
    expect(boxes[2]!.x + boxes[2]!.width).toBeLessThanOrEqual(cell!.x + cell!.width + 1)
  })
})
