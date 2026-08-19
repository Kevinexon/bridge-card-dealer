import { expect, Locator, Page } from '@playwright/test';

export type Seat = 'North' | 'East' | 'South' | 'West';
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type BidSuit = Suit | 'NT';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export const SEATS: readonly Seat[] = ['North', 'East', 'South', 'West'];

const NO_ANIMATIONS = `*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}`;

export class TablePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/stolik');
    // Ripple Material i animacje drag&drop CDK to jedyne zrodlo niestabilnosci
    // w tej aplikacji — cala reszta jest deterministyczna (spec sekcja 3).
    await this.page.addStyleTag({ content: NO_ANIMATIONS });
    await expect(this.hand('North')).toBeVisible();
  }

  hand(seat: Seat): Locator {
    return this.page.getByTestId(`hand-${seat}`);
  }

  card(suit: Suit, rank: Rank): Locator {
    return this.page.getByTestId(`card-${suit}-${rank}`);
  }

  async expectHandSize(seat: Seat, expected: number): Promise<void> {
    await expect(this.hand(seat).locator('[data-testid^="card-"]')).toHaveCount(expected);
  }

  async expectTurn(seat: Seat): Promise<void> {
    // Klasa .bg-indigo-300 (hand.html) jest jedynym wskaznikiem tury w aplikacji.
    // Swiadomy wyjatek od zasady "zadnych selektorow CSS", zamkniety w tej metodzie.
    await expect(this.hand(seat).locator('.bg-indigo-300')).toBeVisible();
  }

  async toggleHandVisibility(seat: Seat): Promise<void> {
    await this.page.getByTestId(`hand-${seat}-visibility`).click();
  }

  bidLevelButton(level: number): Locator {
    return this.page.getByTestId(`bid-level-${level}`);
  }

  bidSuit(suit: BidSuit): Locator {
    return this.page.getByTestId(`bid-suit-${suit}`);
  }

  doubleButton(): Locator {
    return this.page.getByTestId('bid-double');
  }

  redoubleButton(): Locator {
    return this.page.getByTestId('bid-redouble');
  }

  biddingColumn(seat: Seat): Locator {
    return this.page.getByTestId(`bidding-column-${seat}`);
  }

  contractDisplay(): Locator {
    return this.page.getByTestId('contract-display');
  }

  async bidLevel(level: number): Promise<void> {
    await this.bidLevelButton(level).click();
  }

  async bid(level: number, suit: BidSuit): Promise<void> {
    await this.bidLevel(level);
    await this.bidSuit(suit).click();
  }

  async pass(): Promise<void> {
    await this.page.getByTestId('bid-pass').click();
  }

  async double(): Promise<void> {
    await this.doubleButton().click();
  }

  async redouble(): Promise<void> {
    await this.redoubleButton().click();
  }

  async openAdminTab(name: 'Rozdanie' | 'Cofnij'): Promise<void> {
    await this.page.getByRole('tab', { name }).click();
  }

  async undoBid(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('undo-bid').click();
  }

  async resetBidding(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('reset-bidding').click();
  }

  async setDealer(seat: Seat): Promise<void> {
    await this.openAdminTab('Rozdanie');
    await this.page.getByTestId(`dealer-${seat}`).click();
  }

  async dragCard(suit: Suit, rank: Rank, options: { to: Seat }): Promise<void> {
    const from = await this.card(suit, rank).boundingBox();
    const to = await this.hand(options.to).boundingBox();
    if (!from || !to) {
      throw new Error(`Cannot drag ${suit} ${rank} to ${options.to}: element not laid out`);
    }
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height / 2;
    const endX = to.x + to.width / 2;
    const endY = to.y + to.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // CDK drag-drop ignoruje pojedynczy skok myszy — potrzebuje serii ruchow,
    // zeby uznac gest za przeciagniecie i wyemitowac cdkDropListDropped.
    const steps = 12;
    for (let step = 1; step <= steps; step++) {
      await this.page.mouse.move(
        startX + ((endX - startX) * step) / steps,
        startY + ((endY - startY) * step) / steps,
      );
    }
    await this.page.mouse.up();
  }
}
