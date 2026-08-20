import {
  Component,
  computed,
  inject,
  linkedSignal,
  model,
  ModelSignal,
  OnInit,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { AdminPanel } from '../../ui/admin-panel/admin-panel';
import { BiddingPanel } from '../../ui/bidding-panel/bidding-panel';
import { BiddingTable } from '../../ui/bidding-table/bidding-table';
import { Hand } from '../../ui/hand/hand';
import { PlayArea } from '../../ui/play-area/play-area';
import { TricksCount } from '../../ui/tricks-count/tricks-count';
import {
  Bidding,
  BiddingDenominationToSuitMap,
  Contract,
  createContract,
  findDeclarer,
  findHighestBid,
  isBiddingPhaseOver,
  isContractDoubledOrRedoubled,
} from '../../utils/bidding.util';
import { Card, HandName } from '../../utils/card.util';
import { TableService } from '../../utils/services/table-service';
import { AlertPanel } from '../../ui/alert-panel/alert-panel';

@Component({
  selector: 'app-table',
  imports: [Hand, PlayArea, TricksCount, BiddingTable, BiddingPanel, AdminPanel, AlertPanel],
  providers: [TableService],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table implements OnInit {
  tableService = inject(TableService);

  dealer: ModelSignal<HandName> = model<HandName>('North');
  linesVulnerable: ModelSignal<('NS' | 'WE')[]> = model<('NS' | 'WE')[]>([]);
  cardsMovementEnabled: ModelSignal<boolean> = model(false);

  number = model<number>(1);

  biddingHistory: WritableSignal<Bidding[]> = signal([]);
  contract: WritableSignal<Contract | null> = signal(null);
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

  isNsVulnerable = computed(() => this.linesVulnerable().some((l) => l === 'NS'));
  isEwVulnerable = computed(() => this.linesVulnerable().some((l) => l === 'WE'));

  playedTricks = computed(() => this.tableService.playedTricks());

  biddingPhase = computed(() => this.contract() == null);

  alertedBiddings = computed(() => {
    return this.biddingHistory().filter((b) => b.alertInfo);
  });

  ngOnInit(): void {
    this.tableService.dealNewDeck();
  }

  dealNewDeck() {
    this.reset();
    this.tableService.dealNewDeck();
  }

  reset() {
    this.contract.set(null);
    this.biddingHistory.set([]);
    this.tableService.playedTricks.set([]);
    this.playedCards.set([]);
    this.whichHandsTurn.set(this.dealer());
    this.tableService.refreshPlayedCards();
  }

  onBidding(event: Bidding) {
    this.biddingHistory.set([...this.biddingHistory(), event]);
    if (isBiddingPhaseOver(this.biddingHistory(), event)) {
      this.endBiddingPhase();
    }
    this.changePlayerTurn();
  }

  addAlertInfo() {
    this.biddingHistory.set([...this.biddingHistory()]);
  }

  onMoveCard(event: { card: Card; targetHand: HandName }) {
    this.tableService.moveCard(event.targetHand, event.card);
  }

  onUndoBid() {
    if (this.biddingHistory().length > 0) {
      let lastBidder = this.biddingHistory().slice(-1)[0].bidder;
      this.biddingHistory().splice(this.biddingHistory().length - 1);
      this.biddingHistory.set([...this.biddingHistory()]);
      this.goBackToBiddingPhase(lastBidder);
    }
  }

  resetBidding() {
    this.biddingHistory.set([]);
    this.goBackToBiddingPhase(this.dealer());
  }

  onCardPlayed(card: Card) {
    this.tableService.playCard(card);
    this.addPlayedCard(card);
    if (this.playedCards().length === 4) {
      const biddingDenomination = this.contract()?.denomination;
      this.tableService.handleTrickCompletion(
        this.playedCards(),
        biddingDenomination != null
          ? BiddingDenominationToSuitMap.get(biddingDenomination)
          : undefined,
      );
      this.whichHandsTurn.set(this.tableService.playedTricks().slice(-1)[0].winner!);
    } else {
      this.changePlayerTurn();
    }
  }

  onUndoCard() {
    if (this.isTrickInProgress()) {
      const lastCard = this.playedCards().slice(-1)[0];
      lastCard.isPlayed = false;
      this.playedCards().splice(this.playedCards().length - 1);
      this.playedCards.set([...this.playedCards()]);
      this.whichHandsTurn.set(lastCard.hand);
    } else if (this.playedTricks().length > 0) {
      const lastTrick = this.tableService.undoTrick();
      const lastPlayer = lastTrick.playedCards[3].hand;
      lastTrick.playedCards[3].isPlayed = false;
      lastTrick.playedCards.splice(3);
      this.playedCards.set([...lastTrick.playedCards]);
      this.whichHandsTurn.set(lastPlayer);
    }
    this.tableService.refreshDeck();
  }

  onUndoTrick() {
    if (this.isTrickInProgress()) {
      const firstPlayer = this.playedCards()[0].hand;
      this.playedCards().forEach((c) => (c.isPlayed = false));
      this.playedCards.set([]);
      this.whichHandsTurn.set(firstPlayer);
    } else if (this.playedTricks().length > 0) {
      const lastTrick = this.tableService.undoTrick();
      lastTrick.playedCards.forEach((c) => (c.isPlayed = false));
      this.whichHandsTurn.set(lastTrick.playedCards[0].hand);
      this.playedCards.set([]);
    }
    this.tableService.refreshDeck();
  }

  // Zakonczona lewa zostaje w playedCards jako czteroelementowa tablica az do
  // zagrania piatej karty (addPlayedCard), wiec sama niepustosc nie odroznia
  // lewy w toku od zakonczonej. Cofanie zakonczonej lewy nalezy do galezi
  // operujacej na playedTricks, inaczej licznik lew zostaje nietkniety.
  private isTrickInProgress(): boolean {
    const count = this.playedCards().length;
    return count > 0 && count < 4;
  }

  resetPlayedCards() {
    const contract = this.contract();
    if (contract) {
      this.playedCards.set([]);
      this.tableService.refreshPlayedCards();
      this.whichHandsTurn.set(findDeclarer(this.biddingHistory(), contract));
      this.changePlayerTurn();
    }
  }

  private refreshPlayedCards() {
    this.tableService.refreshPlayedCards();
  }

  private goBackToBiddingPhase(biddingPlayer: HandName) {
    this.playedCards.set([]);
    this.contract.set(null);
    this.whichHandsTurn.set(biddingPlayer);
    this.refreshPlayedCards();
  }

  private changePlayerTurn(isBackward?: boolean) {
    const handOrder: HandName[] = ['North', 'East', 'South', 'West'];
    const currentIndex = handOrder.indexOf(this.whichHandsTurn());
    let nextIndex = 0;
    if (isBackward) {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : 3;
    } else {
      nextIndex = (currentIndex + 1) % handOrder.length;
    }
    this.whichHandsTurn.set(handOrder[nextIndex]);
  }

  private addPlayedCard(card: Card) {
    let playedCards = this.playedCards();
    if (playedCards.length >= 4) {
      playedCards = [];
    }
    this.playedCards.set([...playedCards, card]);
  }

  private endBiddingPhase() {
    const highestBid = findHighestBid(this.biddingHistory());
    if (!highestBid) {
      // Rozdanie spasowane — nikt nie licytowal, wiec kontrakt nie powstaje.
      return;
    }
    const declarer = findDeclarer(this.biddingHistory(), highestBid);
    this.whichHandsTurn.set(declarer);
    const isDoubled = isContractDoubledOrRedoubled(this.biddingHistory(), highestBid);
    this.contract.set(createContract(highestBid, declarer, isDoubled === 'X', isDoubled === 'XX'));
  }
}
