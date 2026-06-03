import { Component, computed, input, signal } from '@angular/core';
import { Bidding } from '../../utils/bidding.util';

@Component({
  selector: 'app-bidding-table',
  imports: [],
  templateUrl: './bidding-table.html',
  styleUrl: './bidding-table.css',
})
export class BiddingTable {
  biddingHistory = input.required<Bidding[]>();
  isNSVulnerable = input<boolean>(false);
  isEWVulnerable = input<boolean>(false);

  northHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'North'));
  eastHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'East'));
  southHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'South'));
  westHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'West'));

  colSpans = computed(() => {
    const colSpans = { North: 0, East: 1, South: 2, West: 3 };
    const firstHand = this.biddingHistory()[0]?.bidder;
    return firstHand == null ? 0 : colSpans[firstHand];
  });
}
