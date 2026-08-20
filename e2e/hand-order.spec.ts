import { expect, test } from '@playwright/test';
import { TablePage } from './pages/table.page';

// "Zeberka" — prosba uczniow: kolory w rece maja sie przeplatac czarny-czerwony,
// zeby dwa czerwone nigdy nie stykaly sie ze soba. Domyslne rozdanie daje kazdemu
// graczowi jeden pelny kolor, wiec zeby kolejnosc byla w ogole widoczna, testy
// najpierw dokladaja Northowi po jednej karcie z pozostalych kolorow.
test.describe('hand order', () => {
  test('alternates black and red suits while there is no contract', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('hearts', 'A', { to: 'North' });
    await table.dragCard('clubs', 'A', { to: 'North' });
    await table.dragCard('diamonds', 'A', { to: 'North' });

    await table.expectSuitOrder('North', ['spades', 'hearts', 'clubs', 'diamonds']);
  });

  test('moves the trump suit to the front once the contract is known', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('hearts', 'A', { to: 'North' });
    await table.dragCard('clubs', 'A', { to: 'North' });
    await table.dragCard('diamonds', 'A', { to: 'North' });
    await table.enableEditMode();

    await table.bidToContract(1, 'diamonds');

    await table.expectSuitOrder('North', ['diamonds', 'spades', 'hearts', 'clubs']);
  });

  test('keeps the plain order for a no-trump contract', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('hearts', 'A', { to: 'North' });
    await table.dragCard('clubs', 'A', { to: 'North' });
    await table.dragCard('diamonds', 'A', { to: 'North' });
    await table.enableEditMode();

    await table.bidToContract(1, 'NT');

    await table.expectSuitOrder('North', ['spades', 'hearts', 'clubs', 'diamonds']);
  });
});
