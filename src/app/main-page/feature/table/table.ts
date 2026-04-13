import {
  Component,
  computed,
  inject,
  linkedSignal,
  OnInit,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Hand } from '../../ui/hand/hand';
import { PlayArea } from '../../ui/play-area/play-area';
import { TricksCount } from '../../ui/tricks-count/tricks-count';
import { Card, HandName } from '../../utils/card.util';
import { TableService } from '../../utils/services/table-service';
import { BiddingTable } from '../../ui/bidding-table/bidding-table';
import { BiddingPanel } from '../../ui/bidding-panel/bidding-panel';

@Component({
  selector: 'app-table',
  imports: [Hand, PlayArea, TricksCount, BiddingTable, BiddingPanel],
  providers: [TableService],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table implements OnInit {
  tableService = inject(TableService);

  dealer: WritableSignal<HandName> = signal('North');
  cardsMovementEnabled: WritableSignal<boolean> = signal(false);
  biddingFase: WritableSignal<boolean> = signal(false);
  playedCards: WritableSignal<Card[]> = signal([]);

  whichHandsTurn = linkedSignal({
    source: this.dealer,
    computation: (newOptions) => {
      return newOptions;
    },
  });

  northHand: Signal<Card[]> = computed(() => {
    let deck = this.tableService.deck();
    return this.tableService.getCardForHand('North');
  });
  eastHand: Signal<Card[]> = computed(() => {
    let deck = this.tableService.deck();
    return this.tableService.getCardForHand('East');
  });
  southHand: Signal<Card[]> = computed(() => {
    let deck = this.tableService.deck();
    return this.tableService.getCardForHand('South');
  });
  westHand: Signal<Card[]> = computed(() => {
    let deck = this.tableService.deck();
    return this.tableService.getCardForHand('West');
  });

  playedTricks = computed(() => this.tableService.playedTricks());

  ngOnInit(): void {
    this.tableService.dealNewDeck();
  }

  onMoveCard(event: { card: Card; targetHand: HandName }) {
    this.tableService.moveCard(event.targetHand, event.card);
  }

  onCardPlayed(card: Card) {
    this.tableService.playCard(card);
    this.addPlayedCard(card);
    if (this.playedCards().length === 4) {
      this.tableService.handleTrickCompletion(this.playedCards());
      this.whichHandsTurn.set(this.tableService.playedTricks().slice(-1)[0].winner!);
    } else {
      this.changePlayerTurn();
    }
  }

  private changePlayerTurn() {
    const handOrder: HandName[] = ['North', 'East', 'South', 'West'];
    const currentIndex = handOrder.indexOf(this.whichHandsTurn());
    const nextIndex = (currentIndex + 1) % handOrder.length;
    this.whichHandsTurn.set(handOrder[nextIndex]);
  }

  private addPlayedCard(card: Card) {
    let playedCards = this.playedCards();
    if (playedCards.length >= 4) {
      playedCards = [];
    }
    this.playedCards.set([...playedCards, card]);
  }
}
