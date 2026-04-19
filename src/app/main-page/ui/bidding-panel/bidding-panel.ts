import { Component, computed, input, output, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import {
  Bidding,
  BiddingColor,
  BiddingColorSeniorityMap,
  BiddingColorSymbolMap,
  BiddingValue,
  calculateMinLevel,
  createBidding,
  isLastBidderEnemy,
  lastBiddedColorSeniority,
  lastNotPass,
  specialBiddingValueColorMap,
} from '../../utils/bidding.util';
import { HandName } from '../../utils/card.util';

@Component({
  selector: 'app-bidding-panel',
  imports: [MatButtonModule, MatDividerModule, MatRippleModule],
  templateUrl: './bidding-panel.html',
  styleUrl: './bidding-panel.css',
})
export class BiddingPanel {
  handTurn = input.required<HandName>();
  biddingHistory = input.required<Bidding[]>();

  onBidding = output<Bidding>();

  selectedLevel: WritableSignal<number | null> = signal(null);

  levels: Signal<number[]> = signal(Array.from({ length: 7 }, (_, i) => i + 1)).asReadonly();
  colors: Signal<{ name: BiddingColor; suit: string; seniority: number }[]> = signal([
    {
      name: 'clubs',
      suit: BiddingColorSymbolMap.get('clubs') ?? '♣',
      seniority: BiddingColorSeniorityMap.get('clubs') ?? 0,
    },
    {
      name: 'diamonds',
      suit: BiddingColorSymbolMap.get('diamonds') ?? '♦',
      seniority: BiddingColorSeniorityMap.get('diamonds') ?? 0,
    },
    {
      name: 'hearts',
      suit: BiddingColorSymbolMap.get('hearts') ?? '♥',
      seniority: BiddingColorSeniorityMap.get('hearts') ?? 0,
    },
    {
      name: 'spades',
      suit: BiddingColorSymbolMap.get('spades') ?? '♠',
      seniority: BiddingColorSeniorityMap.get('spades') ?? 0,
    },
    {
      name: 'NT',
      suit: BiddingColorSymbolMap.get('NT') ?? 'BA',
      seniority: BiddingColorSeniorityMap.get('NT') ?? 0,
    },
  ]);

  doubleDisabled = computed(() => {
    let lastBid = lastNotPass(this.biddingHistory());
    if (!lastBid || lastBid.biddingValue === 'X' || lastBid.biddingValue === 'XX') {
      return true;
    }
    return !isLastBidderEnemy(lastBid, this.handTurn());
  });

  redoubleDisabled = computed(() => {
    let lastBid = lastNotPass(this.biddingHistory());
    if (!lastBid || lastBid.biddingValue !== 'X') {
      return true;
    }
    return !isLastBidderEnemy(lastBid, this.handTurn());
  });

  minLevel = computed(() => {
    return calculateMinLevel(this.biddingHistory());
  });

  lastColorSeniority = computed(() => {
    let selectedLevel = this.selectedLevel() ?? 0;
    let minLevel = this.minLevel();
    let lastColorSeniority = lastBiddedColorSeniority(this.biddingHistory());
    if (selectedLevel === 0) {
      return 10;
    }
    if (selectedLevel > minLevel) {
      return -1;
    }
    return lastColorSeniority;
  });

  selectNotValue(isDisabled: boolean, value: BiddingValue) {
    if (!isDisabled) {
      this.onBidding.emit(
        createBidding(this.handTurn(), value, specialBiddingValueColorMap.get(value)),
      );
    }
  }

  selectLevel(isDisabled: boolean, level: number): void {
    if (!isDisabled) {
      this.selectedLevel.set(level);
    }
  }

  selectColor(color: BiddingColor) {
    if (this.selectedLevel() !== null) {
      this.onBidding.emit(
        createBidding(this.handTurn(), this.selectedLevel() as BiddingValue, color),
      );
      this.selectedLevel.set(null);
    }
  }
}
