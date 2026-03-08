import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-hand',
  imports: [MatIcon],
  templateUrl: './hand.html',
  styleUrl: './hand.css',
})
export class Hand {
  handName = input.required<string>();
  isDealer = input<boolean>(false);
  isVulnerable = input<boolean>(false);
}
