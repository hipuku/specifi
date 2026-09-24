import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const VIEWS = ['About this tool', 'Analyse a selector', 'Compare two selectors', 'Rank a stylesheet']

async function open(page: Page, view: string) {
  await page.goto('/')
  await page.getByRole('button', { name: view, exact: true }).click()
  // Let the nav's colour transitions finish, or axe measures a colour halfway
  // between two states that no one ever reads.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)))
}

/* Every view, in a real browser, so axe can measure colour contrast, which
   the jsdom suite cannot. */
for (const view of VIEWS) {
  test(`${view} has no axe violations`, async ({ page }) => {
    await open(page, view)
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((v) => ({ id: v.id, targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }))).toEqual([])
  })
}

/* Tab through each view and require that whatever takes focus is actually on
   screen: a control that takes focus while hidden is invisible to a keyboard
   user, and no unit test sees it. */
for (const view of VIEWS) {
  test(`${view}: everything that takes focus is visible`, async ({ page }) => {
    await open(page, view)
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      if ((await focused.count()) === 0) continue
      await expect(focused).toBeVisible()
    }
  })
}

test('scores a selector by its IDs, classes and types', async ({ page }) => {
  await open(page, 'Analyse a selector')
  await page.getByLabel('Selector').fill('#main .card:hover > a')
  // (1, 2, 1): one ID, a class and a pseudo-class, one type.
  await expect(metric(page, '[a] IDs')).toContainText('1')
  await expect(metric(page, '[b] classes')).toContainText('2')
  await expect(metric(page, '[c] types')).toContainText('1')
})

const metric = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator('..')
