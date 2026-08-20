import { expect, test } from '@playwright/test';
import { TablePage } from './pages/table.page';

test.describe('bidding', () => {
  test('records calls in the bidder column', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'clubs');
    await table.bid(1, 'hearts');
    await table.bid(1, 'spades');
    await table.pass();

    await expect(table.biddingColumn('North')).toContainText('1');
    await expect(table.biddingColumn('East')).toContainText('1');
    await expect(table.biddingColumn('West')).toContainText('PASS');
  });

  test('disables suits ranking below the last bid at the same level', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'hearts');
    await table.bidLevel(1);

    await expect(table.bidSuit('clubs')).toHaveClass(/bidding-button-disabled/);
    await expect(table.bidSuit('diamonds')).toHaveClass(/bidding-button-disabled/);
    await expect(table.bidSuit('spades')).not.toHaveClass(/bidding-button-disabled/);
  });

  test('requires a higher level after a notrump bid', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'NT');

    await expect(table.bidLevelButton(1)).toHaveClass(/bidding-button-disabled/);
    await expect(table.bidLevelButton(2)).not.toHaveClass(/bidding-button-disabled/);
  });

  test('allows a double only over an opponent bid', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await expect(table.doubleButton()).toHaveClass(/bidding-button-disabled/);

    await table.bid(1, 'clubs');
    await expect(table.doubleButton()).not.toHaveClass(/bidding-button-disabled/);

    await table.double();
    await expect(table.doubleButton()).toHaveClass(/bidding-button-disabled/);
    await expect(table.redoubleButton()).not.toHaveClass(/bidding-button-disabled/);
  });

  test('ends the auction after three passes and shows the contract', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.pass();
    await table.pass();

    await expect(table.contractDisplay()).toContainText('North');
    await expect(table.contractDisplay()).toContainText('♠');
  });

  test('undoes a single call', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.undoBid();

    await expect(table.biddingColumn('East')).not.toContainText('PASS');
    await table.expectTurn('East');
  });

  test('clears the whole auction', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.resetBidding();

    await expect(table.biddingColumn('North')).not.toContainText('1');
    await table.expectTurn('North');
  });

  test('shifts the columns when the dealer is not North', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.setDealer('East');
    await table.bid(1, 'spades');

    await expect(table.biddingColumn('East')).toContainText('1');
    await expect(table.biddingColumn('North')).not.toContainText('1');
  });

  test('does not crash when everyone passes', async ({ page }) => {
    // Bug 1: findHighestBid zwraca undefined przy czterech pasach, a findDeclarer
    // czyta z tego .bidder. Angular lapie wyjatek globalnym handlerem, wiec
    // aplikacja nie znika z ekranu — dlatego test sprawdza konsole, a nie widok.
    // Asercja na widocznosc kontraktu przechodzilaby trywialnie.
    // Patrz bidding.util.ts:136-146 oraz table.ts:224-230.
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    const table = new TablePage(page);
    await table.goto();
    await table.pass();
    await table.pass();
    await table.pass();
    await table.pass();

    expect(errors).toEqual([]);
  });
});
