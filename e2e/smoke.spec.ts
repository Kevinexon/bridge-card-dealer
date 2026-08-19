import { expect, test } from '@playwright/test';

test('redirects the root path to the table', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/stolik$/);
});
