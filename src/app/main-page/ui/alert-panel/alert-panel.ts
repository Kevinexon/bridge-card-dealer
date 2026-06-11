import { Component, input } from '@angular/core';
import { Bidding } from '../../utils/bidding.util';

@Component({
  selector: 'app-alert-panel',
  imports: [],
  templateUrl: './alert-panel.html',
})
export class AlertPanel {
  alertedBiddings = input.required<Bidding[]>();
}
