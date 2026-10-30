import { expect, test } from '@playwright/test';
import { TablePage } from './pages/table.page';

// Kosz — trener chowa karty, ktore nie sa potrzebne do pokazania, np. wszystko
// poza kierami przy nauce rozgrywania jednego koloru. Na stole widac go tylko
// w trybie edycji rak, zeby nie trafial na nagrania. Domyslne rozdanie: North
// trzyma piki, East kiery, South kara, West trefle.
test.describe('bin', () => {
  test('is shown only in edit mode', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await expect(table.bin()).toHaveCount(0);

    await table.enableEditMode();
    await expect(table.bin()).toBeVisible();

    await table.enableEditMode();
    await expect(table.bin()).toHaveCount(0);
  });

  test('takes a dragged card out of the hand', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'Bin' });

    await table.expectHandSize('North', 12);
    await expect(table.bin().getByTestId('card-spades-A')).toBeVisible();
    await table.expectBinCount(1);
  });

  test('restores every card to the hand it was thrown from', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'Bin' });
    await table.dragCard('hearts', 'K', { to: 'Bin' });
    await table.expectHandSize('North', 12);
    await table.expectHandSize('East', 12);

    await table.restoreBin();

    await table.expectHandSize('North', 13);
    await table.expectHandSize('East', 13);
    await expect(table.hand('North').getByTestId('card-spades-A')).toBeVisible();
    await expect(table.hand('East').getByTestId('card-hearts-K')).toBeVisible();
    await table.expectBinCount(0);
  });

  test('restores a moved card to the hand it was thrown from, not where it was dealt', async ({
    page,
  }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'South' });
    await table.dragCard('spades', 'A', { to: 'Bin' });

    await table.restoreBin();

    await table.expectHandSize('North', 12);
    await table.expectHandSize('South', 14);
  });

  test('lets a single card be dragged back from the bin into any hand', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('hearts', 'A', { to: 'Bin' });
    await table.dragCard('hearts', 'A', { to: 'South' });

    await table.expectHandSize('East', 12);
    await table.expectHandSize('South', 14);
    await table.expectBinCount(0);
  });

  test('keeps binned cards out of the hand when the play is undone', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('clubs', 'A', { to: 'Bin' });
    await table.enableEditMode();
    await table.bidToContract(1, 'NT');
    await table.playRoundOfHighestCards();

    await table.resetPlay();

    await table.expectHandSize('West', 12);
    await table.expectTricks({ ns: 0, ew: 0 });
    await table.expectBinCount(1);
  });

  // Glitch zgloszony przez trenera: zaslepka CDK (kopia karty z klasami listy
  // zrodlowej) rozjezdzala uklad listy docelowej, a sortowanie CDK odsuwalo
  // lezace tam karty. Kolejnosc kart wylicza aplikacja, wiec nic nie ma prawa
  // drgnac, zanim karta zostanie upuszczona.
  test('keeps the cards in place while a card hovers over the bin', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('clubs', 'A', { to: 'Bin' });
    const before = await table.card('clubs', 'A').boundingBox();

    await table.holdCardOver('spades', 'A', { to: 'Bin' });

    await expect(table.dragPlaceholder()).toBeHidden();
    expect(await table.card('clubs', 'A').boundingBox()).toEqual(before);
    await table.releaseCard();
  });

  test('keeps the cards in place while a card from the bin hovers over a hand', async ({
    page,
  }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('clubs', 'A', { to: 'Bin' });
    const before = await table.card('hearts', 'Q').boundingBox();

    await table.holdCardOver('clubs', 'A', { to: 'East' });

    await expect(table.dragPlaceholder()).toBeHidden();
    expect(await table.card('hearts', 'Q').boundingBox()).toEqual(before);
    await table.releaseCard();
  });

  // Przyciski kolorow: jedno klikniecie chowa caly kolor, drugie go przywraca.
  // Dzialaja tez poza trybem edycji — trener chowa kolory w trakcie rozgrywki.
  test('bins every card of a suit with one click', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.toggleSuitInBin('clubs');

    await table.expectHandSize('West', 0);
    await table.expectBinCount(13);
    await expect(table.binSuitButton('clubs')).toHaveAttribute('aria-pressed', 'true');
    await expect(table.binSuitButton('hearts')).toHaveAttribute('aria-pressed', 'false');
  });

  test('restores the whole suit on a second click', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.toggleSuitInBin('clubs');
    await table.toggleSuitInBin('clubs');

    await table.expectHandSize('West', 13);
    await table.expectBinCount(0);
    await expect(table.binSuitButton('clubs')).toHaveAttribute('aria-pressed', 'false');
  });

  test('restores only the clicked suit', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.toggleSuitInBin('clubs');
    await table.toggleSuitInBin('spades');
    await table.toggleSuitInBin('clubs');

    await table.expectHandSize('West', 13);
    await table.expectHandSize('North', 0);
    await table.expectBinCount(13);
  });

  test('bins the rest of a suit when part of it is already in the bin', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('clubs', 'A', { to: 'Bin' });
    await table.openAdminTab('Kosz');
    await expect(table.binSuitButton('clubs')).toHaveAttribute('aria-pressed', 'false');

    await table.toggleSuitInBin('clubs');
    await table.expectHandSize('West', 0);
    await table.expectBinCount(13);

    await table.toggleSuitInBin('clubs');
    await table.expectHandSize('West', 13);
    await table.expectBinCount(0);
  });

  test('returns a suit to the hands its cards were thrown from', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('clubs', 'A', { to: 'North' });

    await table.toggleSuitInBin('clubs');
    await table.toggleSuitInBin('clubs');

    await table.expectHandSize('North', 14);
    await table.expectHandSize('West', 12);
  });

  test('leaves cards already played in a trick on the table', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    // 1BA Northa: wychodzi East kierem, kazdy doklada swoj najwyzszy kolor.
    await table.bidToContract(1, 'NT');
    await table.playRoundOfHighestCards();

    await table.toggleSuitInBin('hearts');

    await table.expectHandSize('East', 0);
    await table.expectBinCount(12);
    await expect(table.playedCard('East')).toBeVisible();
    await expect(table.binSuitButton('hearts')).toHaveAttribute('aria-pressed', 'true');

    await table.toggleSuitInBin('hearts');
    await table.expectHandSize('East', 12);
    await table.expectBinCount(0);
  });

  test('is emptied by a new deal', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('diamonds', 'A', { to: 'Bin' });

    await table.dealNew();

    await table.expectHandSize('South', 13);
    await table.expectBinCount(0);
  });
});
