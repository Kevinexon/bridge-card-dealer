import { Injectable, signal, WritableSignal } from '@angular/core';
import { Card, Suit, createDeck, HandName } from '../card.util';
import { Trick } from '../trick.util';

@Injectable()
export class TableService {
  deck: WritableSignal<Card[]> = signal(createDeck());
  playedTricks: WritableSignal<Trick[]> = signal([]);

  dealNewDeck() {
    const deck = createDeck();
    for (let i = 0; i < deck.length; i++) {
      const hand: HandName = ['North', 'East', 'South', 'West'][i % 4] as HandName;
      deck[i].hand = hand;
    }
    this.deck.set(deck);
    this.playedTricks.set([]);
  }

  moveCard(handTarget: HandName, card: Card) {
    card.hand = handTarget;
    card.isInBin = false;
    this.deck.set([...this.deck()]);
  }

  getCardForHand(hand: HandName): Card[] {
    return this.deck().filter((card) => card.hand === hand && !card.isInBin);
  }

  getBinnedCards(): Card[] {
    return this.deck().filter((card) => card.isInBin);
  }

  binCard(card: Card) {
    card.isInBin = true;
    this.deck.set([...this.deck()]);
  }

  restoreBinnedCards() {
    this.deck().forEach((card) => (card.isInBin = false));
    this.deck.set([...this.deck()]);
  }

  /**
   * Kolor jest "w koszu", gdy w rekach nie zostala zadna jego karta, a w koszu
   * jest choc jedna. Karty zagrane w lewach sie nie licza — przycisk ich nie rusza.
   */
  isSuitInBin(suit: Suit): boolean {
    const suitCards = this.deck().filter((card) => card.suit === suit);
    return (
      suitCards.some((card) => card.isInBin) &&
      !suitCards.some((card) => !card.isInBin && !card.isPlayed)
    );
  }

  /**
   * Pierwsze klikniecie chowa wszystkie karty koloru z rak — takze wtedy, gdy
   * czesc juz lezy w koszu. Drugie, gdy caly kolor jest w koszu, go przywraca.
   */
  toggleSuitInBin(suit: Suit) {
    const restore = this.isSuitInBin(suit);
    this.deck()
      .filter((card) => card.suit === suit && !card.isPlayed)
      .forEach((card) => (card.isInBin = !restore));
    this.deck.set([...this.deck()]);
  }

  playCard(card: Card) {
    card.isPlayed = true;
    this.deck.set([...this.deck()]);
  }

  handleTrickCompletion(playedCards: Card[], trumpSuit?: Suit) {
    this.playedTricks.set([
      ...this.playedTricks(),
      { playedCards, winner: this.determineTrickWinner(playedCards, trumpSuit) },
    ]);
  }

  undoTrick(): Trick {
    const lastTrick = this.playedTricks().slice(-1)[0];
    this.playedTricks().splice(this.playedTricks().length - 1);
    this.playedTricks.set([...this.playedTricks()]);
    return lastTrick;
  }

  refreshPlayedCards() {
    this.deck().forEach((d) => {
      d.isPlayed = false;
    });
    this.deck.set([...this.deck()]);
    this.clearTricks();
  }

  clearTricks() {
    this.playedTricks.set([]);
  }

  refreshDeck() {
    this.deck.set([...this.deck()]);
  }

  private determineTrickWinner(playedCards: Card[], trumpSuit?: Suit): HandName {
    if (trumpSuit) {
      const trumpCards = playedCards.filter((card) => card.suit === trumpSuit);
      if (trumpCards.length > 0) {
        trumpCards.sort((a, b) => b.sortValue - a.sortValue);
        return trumpCards[0].hand;
      }
    }
    let trickSuit = playedCards[0].suit;
    const sameSuitCards = playedCards.filter((card) => card.suit === trickSuit);
    sameSuitCards.sort((a, b) => b.sortValue - a.sortValue);
    return sameSuitCards[0].hand;
  }
}
