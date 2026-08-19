import { expect, test } from '@playwright/test';
import { SEATS, TablePage } from './pages/table.page';

test.describe('initial state', () => {
  test('redirects the root path to the table', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/stolik$/);
  });

  test('deals thirteen cards to every seat', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    for (const seat of SEATS) {
      await table.expectHandSize(seat, 13);
    }
  });

  test('deals one complete suit to each seat', async ({ page }) => {
    // Utrwala deterministyczny rozklad z card.util.ts — patrz spec sekcja 3.
    const table = new TablePage(page);
    await table.goto();
    await expect(table.hand('North').getByTestId('card-spades-A')).toBeVisible();
    await expect(table.hand('East').getByTestId('card-hearts-A')).toBeVisible();
    await expect(table.hand('South').getByTestId('card-diamonds-A')).toBeVisible();
    await expect(table.hand('West').getByTestId('card-clubs-A')).toBeVisible();
  });

  test('starts the auction with North on turn', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.expectTurn('North');
  });
});
