import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, input, output, signal } from '@angular/core';
import { Card, Suit, HandName, suitDisplayOrder } from '../../utils/card.util';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hand',
  templateUrl: './hand.html',
  styleUrl: './hand.css',
  imports: [CdkDrag, CdkDropList, MatButtonModule, MatIconModule],
})
export class Hand {
  handName = input.required<HandName>();
  handDeck = input.required<Card[]>();
  handsTurn = input.required<boolean>();

  restHands = input<HandName[]>([]);
  isDealer = input<boolean>(false);
  isVulnerable = input<boolean>(false);
  canPlay = input<boolean>(false);
  canMoveCards = input<boolean>(false);
  isDummy = input<boolean>(false);
  /// Kolor atutowy z kontraktu; null w licytacji i przy kontrakcie w BA.
  trumpSuit = input<Suit | null>(null);

  hideCards = signal<boolean>(false);
  reverseUrl = signal<string>('cards/reverse.png');

  cardPlayed = output<Card>();
  cardDropped = output<{ card: Card; targetHand: HandName }>();

  sortedHandDeck = computed(() => {
    let handDeckToSort = this.handDeck();
    handDeckToSort = handDeckToSort.filter((card) => !card.isPlayed);
    handDeckToSort.sort((a, b) => b.sortValue - a.sortValue);
    handDeckToSort.sort((a, b) => {
      const suitOrder = suitDisplayOrder(this.trumpSuit());
      return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    });
    return handDeckToSort;
  });

  sortedDummyHandDeck = computed(() => {
    const sortedCards = this.sortedHandDeck();
    const suitOrder = suitDisplayOrder(this.trumpSuit());
    const handBySuit: Card[][] = [[], [], [], []];

    sortedCards.forEach((card) => {
      const suitIndex = suitOrder.indexOf(card.suit);
      handBySuit[suitIndex].push(card);
    });

    return handBySuit;
  });

  playCard(card: Card) {
    if (this.canPlay() && this.handsTurn() && !this.canMoveCards()) {
      this.cardPlayed.emit(card);
    }
  }

  drop(event: CdkDragDrop<Card[]>) {
    this.cardDropped.emit({
      targetHand: event.container.id as HandName,
      card: event.item.data,
    });
  }

  changeVisibility() {
    this.hideCards.set(!this.hideCards());
  }
}
