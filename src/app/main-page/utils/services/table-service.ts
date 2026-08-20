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
    this.deck.set([...this.deck()]);
  }

  getCardForHand(hand: HandName): Card[] {
    return this.deck().filter((card) => card.hand === hand);
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
