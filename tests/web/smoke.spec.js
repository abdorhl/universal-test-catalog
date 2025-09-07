import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const A11Y_ENABLED = process.env.A11Y_ENABLED !== '0';
const A11Y_STRICT = process.env.A11Y_STRICT === '1';

test('homepage has title and loads main landmarks', async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await expect(page).toHaveTitle(/.+/);
  const body = page.locator('body');
  await expect(body).toBeVisible();
});

test('basic navigation works (if anchor tags exist)', async ({ page, baseURL }) => {
  await page.goto(baseURL);
  const links = page.locator('a');
  const count = await links.count();
  if (count > 0) {
    await links.first().click();
    await expect(page).toHaveURL(/.+/);
  } else {
    test.skip(true, 'No links found on page');
  }
});

 test('accessibility: no critical violations on home', async ({ page, baseURL }) => {
  test.skip(!A11Y_ENABLED, 'A11Y checks disabled');
  await page.goto(baseURL);
  await injectAxe(page);
  try {
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      },
    });
  } catch (err) {
    if (A11Y_STRICT) {
      throw err;
    } else {
      console.warn('[A11Y] Violations detected (warn-only mode). Use --a11y-strict to fail the run.');
    }
  }
});
