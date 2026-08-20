import { expect, test } from '@playwright/test';
import { TablePage } from './pages/table.page';

test.describe('trainer controls', () => {
  test('moves a card between hands in edit mode', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'South' });

    await table.expectHandSize('North', 12);
    await table.expectHandSize('South', 14);
  });

  test('does not play a card while edit mode is on', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.enableEditMode();
    await table.playCard('spades', 'A');

    await table.expectHandSize('North', 13);
  });

  test('hides and reveals a hand', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    const ace = table.card('spades', 'A');
    await expect(ace).toHaveAttribute('src', /spades_A/);

    await table.toggleHandVisibility('North');
    await expect(ace).toHaveAttribute('src', /reverse/);

    await table.toggleHandVisibility('North');
    await expect(ace).toHaveAttribute('src', /spades_A/);
  });

  test('attaches an alert to a call and shows it in the alert panel', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'clubs');
    await table.addAlert('North', 'Otwarcie przygotowawcze');

    await expect(table.alertItems()).toHaveCount(1);
    await expect(table.alertItems().first()).toContainText('Otwarcie przygotowawcze');
  });

  test('changing the dealer resets the deal', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.setDealer('South');

    await expect(table.biddingColumn('North')).not.toContainText('1');
    await table.expectTurn('South');
  });

  test('shows the board number in the bidding panel', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.setBoardNumber(7);

    await expect(page.getByTestId('bidding-panel-board-number')).toHaveText('7');
  });

  test('marks a partnership as vulnerable', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.expectVulnerable('North', false);

    await table.setVulnerable('NS');
    await table.expectVulnerable('North', true);
    await table.expectVulnerable('South', true);
    await table.expectVulnerable('East', false);
  });

  test('redeals the standard layout after cards were moved', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'South' });
    await table.expectHandSize('North', 12);

    await table.dealNew();
    await table.expectHandSize('North', 13);
    await expect(table.hand('North').getByTestId('card-spades-A')).toBeVisible();
  });
});
