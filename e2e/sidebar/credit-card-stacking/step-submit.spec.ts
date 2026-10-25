import { test, expect, expectOk } from '../../support/fixtures'
import { API_BASE_URL } from '../../support/env'

// Real submit of a roadmap step on the borrower's current play.
// Approved steps are read-only, and the next step can be locked by the
// roadmap's schedule (Day N / time-of-day window). So:
//  - if an open step exists, it is saved as "Pending" through the UI;
//  - if the next step is locked, the API must refuse a direct submit (E2E-016).
test.describe('Sidebar › Capital Access (step submit)', () => {
  test('saves an open step, or the API refuses a locked one', async ({ page }) => {
    test.setTimeout(300_000)
    await page.goto('/capital-access')
    const roadmapLink = page.locator('.page-content a[href*="/roadmap"]').first()
    await expect(roadmapLink).toBeVisible({ timeout: 90_000 })
    const playId = (await roadmapLink.getAttribute('href'))?.match(/capital-access\/(\d+)\/roadmap/)?.[1]

    const roadmapRes = page.waitForResponse((r) => r.url().includes(`/strategies/${playId}/roadmap`))
    await roadmapLink.click()
    const roadmap: { id: number; application_status?: string | null }[] = (await (await roadmapRes).json())?.data?.roadmap ?? []
    // Approved steps are read-only; a Pending/Declined one can be saved again,
    // so the test stays repeatable once it has saved a step.
    const next = roadmap.find((s) => s.application_status !== 'Approved')
    expect(next, 'Every step of the current play is approved').toBeTruthy()

    await page.goto(`/capital-access/${playId}/step/${next!.id}`)
    await expect(page.locator('.page-content h4').first()).toBeVisible({ timeout: 60_000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    const formOpen = await page.locator('.ca-status-selector-card').first().isVisible().catch(() => false)

    if (formOpen) {
      await page.locator('.ca-status-selector-card', { hasText: 'Pending' }).click()
      await expect(page.locator('.ca-status-selector-card.selected-pending')).toBeVisible()
      const notes = page.getByPlaceholder(/Provide any application notes/)
      if (await notes.isVisible().catch(() => false)) await notes.fill(`E2E note ${new Date().toISOString()}`)

      const submit = page.waitForResponse((r) => r.request().method() === 'POST' && /\/step\/\d+\/submit/.test(r.url()))
      await page.getByRole('button', { name: /Save & Continue/ }).click()
      const res = await submit
      await expectOk(res)
      expect((await res.json()).status).toBe(true)
    } else {
      // Locked in the UI: the API must agree.
      const token = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.token)
      const timezone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
      const res = await page.request.post(`${API_BASE_URL}/borrower/capital-access/strategies/${playId}/step/${next!.id}/submit`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'X-Timezone': timezone },
        data: { status: 'Pending', notes: 'E2E lock check' },
      })
      expect(res.status(), await res.text()).toBe(403)
    }
  })
})
