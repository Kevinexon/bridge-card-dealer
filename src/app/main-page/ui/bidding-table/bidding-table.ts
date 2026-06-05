import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Bidding } from '../../utils/bidding.util';
import { MatDialog } from '@angular/material/dialog';
import { AlertInfoDialog } from '../alert-info-dialog/alert-info-dialog';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-bidding-table',
  imports: [MatBadgeModule],
  templateUrl: './bidding-table.html',
  styleUrl: './bidding-table.css',
})
export class BiddingTable {
  readonly dialog = inject(MatDialog);

  biddingHistory = input.required<Bidding[]>();
  isNSVulnerable = input<boolean>(false);
  isEWVulnerable = input<boolean>(false);

  addAlertInfo = output<Bidding>();

  northHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'North'));
  eastHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'East'));
  southHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'South'));
  westHistory = computed(() => this.biddingHistory().filter((bid) => bid.bidder === 'West'));

  colSpans = computed(() => {
    const colSpans = { North: 0, East: 1, South: 2, West: 3 };
    const firstHand = this.biddingHistory()[0]?.bidder;
    return firstHand == null ? 0 : colSpans[firstHand];
  });

  openAlertDialog(item: Bidding) {
    const dialogRef = this.dialog.open(AlertInfoDialog, {
      data: item,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        item.alertInfo = result;
        this.addAlertInfo.emit(item);
      }
    });
  }
}
