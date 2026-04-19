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

  onCardPlayed = output<Card>();
  onCardDropped = output<{ card: Card; targetHand: HandName }>();

  sortedHandDeck = computed(() => {
    let hendDeck = this.handDeck();
    hendDeck = hendDeck.filter((card) => !card.isPlayed);
    hendDeck.sort((a, b) => b.sortValue - a.sortValue);
    hendDeck.sort((a, b) => {
      const colorOrder: CardColor[] = ['spades', 'hearts', 'diamonds', 'clubs'];
      return colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
    });
    return hendDeck;
  });

  sortedDummyHandDeck = computed(() => {
    const hendDeck = this.sortedHandDeck();
    const colorOrder: CardColor[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const handBySuit: Card[][] = [[], [], [], []];

    hendDeck.forEach((card) => {
      const colorIndex = colorOrder.indexOf(card.color);
      handBySuit[colorIndex].push(card);
    });

    return handBySuit;
  });

  cardPlayed(card: Card) {
    if (this.canPlay() && this.handsTurn() && !this.canMoveCards()) {
      this.onCardPlayed.emit(card);
    }
  }

  drop(event: CdkDragDrop<Card[]>) {
    this.onCardDropped.emit({
      targetHand: event.container.id as HandName,
      card: event.item.data,
    });
  }

  changeVisibility() {
    this.hideCards.set(!this.hideCards());
  }
}
