import {
  Component,
  computed,
  input,
  InputSignal,
  output,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import {
  Bidding,
  BiddingDenomination,
  BiddingDenominationSeniorityMap,
  BiddingDenominationSymbolMap,
  BiddingValue,
  calculateMinLevel,
  createBidding,
  isLastBidderEnemy,
  lastBiddedDenominationSeniority,
  lastNotPass,
  specialBiddingValueDenominationMap,
} from '../../utils/bidding.util';
import { HandName } from '../../utils/card.util';

@Component({
  selector: 'app-bidding-panel',
  imports: [MatButtonModule, MatDividerModule, MatRippleModule],
  templateUrl: './bidding-panel.html',
  styleUrl: './bidding-panel.css',
})
export class BiddingPanel {
  number: InputSignal<number> = input.required();
  biddingHistory = input.required<Bidding[]>();
  handTurn = input.required<HandName>();

  bidPlaced = output<Bidding>();

  selectedLevel: WritableSignal<number | null> = signal(null);

  levels: Signal<number[]> = signal(Array.from({ length: 7 }, (_, i) => i + 1)).asReadonly();
  denominations: Signal<{ name: BiddingDenomination; symbol: string; seniority: number }[]> =
    signal([
      {
        name: 'clubs',
        symbol: BiddingDenominationSymbolMap.get('clubs') ?? '♣',
        seniority: BiddingDenominationSeniorityMap.get('clubs') ?? 0,
      },
      {
        name: 'diamonds',
        symbol: BiddingDenominationSymbolMap.get('diamonds') ?? '♦',
        seniority: BiddingDenominationSeniorityMap.get('diamonds') ?? 0,
      },
      {
        name: 'hearts',
        symbol: BiddingDenominationSymbolMap.get('hearts') ?? '♥',
        seniority: BiddingDenominationSeniorityMap.get('hearts') ?? 0,
      },
      {
        name: 'spades',
        symbol: BiddingDenominationSymbolMap.get('spades') ?? '♠',
        seniority: BiddingDenominationSeniorityMap.get('spades') ?? 0,
      },
      {
        name: 'NT',
        symbol: BiddingDenominationSymbolMap.get('NT') ?? 'BA',
        seniority: BiddingDenominationSeniorityMap.get('NT') ?? 0,
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

  lastDenominationSeniority = computed(() => {
    let selectedLevel = this.selectedLevel() ?? 0;
    let minLevel = this.minLevel();
    let lastDenominationSeniority = lastBiddedDenominationSeniority(this.biddingHistory());
    if (selectedLevel === 0) {
      return 10;
    }
    if (selectedLevel > minLevel) {
      return -1;
    }
    return lastDenominationSeniority === 5 ? -1 : lastDenominationSeniority;
  });

  selectNotValue(isDisabled: boolean, value: BiddingValue) {
    if (!isDisabled) {
      this.bidPlaced.emit(
        createBidding(this.handTurn(), value, specialBiddingValueDenominationMap.get(value)),
      );
    }
    this.selectedLevel.set(null);
  }

  selectLevel(isDisabled: boolean, level: number): void {
    if (!isDisabled) {
      this.selectedLevel.set(level);
    }
  }

  selectDenomination(isDisabled: boolean, denomination: BiddingDenomination) {
    if (!isDisabled && this.selectedLevel() !== null) {
      this.bidPlaced.emit(
        createBidding(this.handTurn(), this.selectedLevel() as BiddingValue, denomination),
      );

      this.selectedLevel.set(null);
    }
  }
}
