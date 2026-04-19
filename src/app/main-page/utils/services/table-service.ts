import { Injectable, signal, WritableSignal } from '@angular/core';
import { Card, CardColor, createDeck, HandName } from '../card.util';
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
    this.deck.set([...this.deck()]);
  }

  getCardForHand(hand: HandName): Card[] {
    return this.deck().filter((card) => card.hand === hand);
  }

  playCard(card: Card) {
    card.isPlayed = true;
    this.deck.set([...this.deck()]);
  }

  handleTrickCompletion(playedCards: Card[], trumpSuit?: CardColor) {
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

  private determineTrickWinner(playedCards: Card[], trumpSuit?: CardColor): HandName {
    if (trumpSuit) {
      const trumpCards = playedCards.filter((card) => card.color === trumpSuit);
      if (trumpCards.length > 0) {
        trumpCards.sort((a, b) => b.sortValue - a.sortValue);
        return trumpCards[0].hand;
      }
    }
    let trickColor = playedCards[0].color;
    const sameColorCards = playedCards.filter((card) => card.color === trickColor);
    sameColorCards.sort((a, b) => b.sortValue - a.sortValue);
    return sameColorCards[0].hand;
  }
}
