import { expect, test } from '@playwright/test';
import { SEATS, TablePage } from './pages/table.page';

// Wyjscie przypada lewemu przeciwnikowi rozgrywajacego. Rozdajacym jest North,
// wiec po kontrakcie zalicytowanym przez Northa wychodzi East — i to on wybiera
// kolor lewy we wszystkich testach ponizej. East trzyma wylacznie kiery.
test.describe('play', () => {
  test('moves a played card from the hand onto the table', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    const leader = await table.seatOnTurn();

    await table.playFromSeat(leader);
    await expect(table.playedCard(leader)).toBeVisible();
    await table.expectHandSize(leader, 12);
  });

  test('lets a trump beat a higher card of the led suit', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    // Atu w pikach: East wychodzi kierem, a North przebija pikiem — mimo ze
    // kier Easta jest wyzszy w swoim kolorze, lewe bierze przebitka.
    await table.bidToContract(1, 'spades');
    await table.playRoundOfHighestCards();

    await table.expectTricks({ ns: 1, ew: 0 });
    await table.expectTurn('North');
  });

  test('lets the leader keep the trick when the opening lead is a trump', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    // Atu w kierach, czyli w jedynym kolorze Easta: nikt inny nie ma czym
    // przebic, wiec wychodzacy zostaje z lewa.
    await table.bidToContract(1, 'hearts');
    await table.playRoundOfHighestCards();

    await table.expectTricks({ ns: 0, ew: 1 });
    await table.expectTurn('East');
  });

  test('awards the trick to the highest card of the led suit without trumps', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    // Bez atu wygrywa najwyzsza karta koloru wyjscia — pozostali tylko zrzucaja,
    // bo zaden z nich nie ma kierow. Lewa zostaje przy wychodzacym Wschodzie.
    await table.bidToContract(1, 'NT');
    await table.playRoundOfHighestCards();

    await table.expectTricks({ ns: 0, ew: 1 });
    await table.expectTurn('East');
  });

  test('undoes the last card and returns the turn', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    const leader = await table.seatOnTurn();
    await table.playFromSeat(leader);
    await table.undoCard();

    await expect(table.playedCard(leader)).toBeHidden();
    await table.expectHandSize(leader, 13);
    await table.expectTurn(leader);
  });

  test('undoes a completed trick', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.playRoundOfHighestCards();
    await table.expectTricks({ ns: 1, ew: 0 });

    await table.undoTrick();

    await table.expectTricks({ ns: 0, ew: 0 });
    for (const seat of SEATS) {
      await expect(table.playedCard(seat)).toBeHidden();
      await table.expectHandSize(seat, 13);
    }
  });

  // Drugi objaw tej samej przyczyny co wyzej: po zakonczonej lewie "Cofnij
  // karte" zdejmowalo czwarta karte ze stolu, ale zostawialo lewe w liczniku.
  test('undoes the last card of a completed trick', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    const order = await table.playRoundOfHighestCards();
    await table.expectTricks({ ns: 1, ew: 0 });

    await table.undoCard();

    const lastPlayer = order[3];
    await table.expectTricks({ ns: 0, ew: 0 });
    await expect(table.playedCard(lastPlayer)).toBeHidden();
    for (const seat of order.slice(0, 3)) {
      await expect(table.playedCard(seat)).toBeVisible();
    }
    await table.expectTurn(lastPlayer);
    await table.expectHandSize(lastPlayer, 13);
  });

  test('resets the whole play', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.playRoundOfHighestCards();
    await table.resetPlay();

    await table.expectTricks({ ns: 0, ew: 0 });
    for (const seat of SEATS) {
      await table.expectHandSize(seat, 13);
    }
  });
});
