import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BIN_ID, Card, HandName, suitDisplayOrder } from '../../utils/card.util';

@Component({
  selector: 'app-bin',
  templateUrl: './bin.html',
  imports: [CdkDrag, CdkDropList, MatIconModule],
})
export class Bin {
  binnedCards = input.required<Card[]>();

  cardBinned = output<Card>();

  readonly binId = BIN_ID;
  readonly hands: HandName[] = ['North', 'East', 'South', 'West'];

  sortedBinnedCards = computed(() => {
    const suitOrder = suitDisplayOrder();
    return [...this.binnedCards()].sort(
      (a, b) => suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit) || b.sortValue - a.sortValue,
    );
  });

  drop(event: CdkDragDrop<Card[]>) {
    this.cardBinned.emit(event.item.data);
  }
}
