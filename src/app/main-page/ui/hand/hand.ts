import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, input, output, signal } from '@angular/core';
import { Card, CardColor, HandName } from '../../utils/card.util';
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

  hideCards = signal<boolean>(false);
  reverseUrl = signal<string>('cards/reverse.png');

  cardPlayed = output<Card>();
  cardDropped = output<{ card: Card; targetHand: HandName }>();

  sortedHandDeck = computed(() => {
    let handDeckToSort = this.handDeck();
    handDeckToSort = handDeckToSort.filter((card) => !card.isPlayed);
    handDeckToSort.sort((a, b) => b.sortValue - a.sortValue);
    handDeckToSort.sort((a, b) => {
      const colorOrder: CardColor[] = ['spades', 'hearts', 'diamonds', 'clubs'];
      return colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
    });
    return handDeckToSort;
  });

  sortedDummyHandDeck = computed(() => {
    const sortedCards = this.sortedHandDeck();
    const colorOrder: CardColor[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const handBySuit: Card[][] = [[], [], [], []];

    sortedCards.forEach((card) => {
      const colorIndex = colorOrder.indexOf(card.color);
      handBySuit[colorIndex].push(card);
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
