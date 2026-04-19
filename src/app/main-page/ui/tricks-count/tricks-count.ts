import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { Contract } from '../../utils/bidding.util';
import { Trick } from '../../utils/trick.util';

@Component({
  selector: 'app-tricks-count',
  imports: [],
  templateUrl: './tricks-count.html',
  styleUrl: './tricks-count.css',
})
export class TricksCount {
  playedTricks: InputSignal<Trick[]> = input.required();
  number: InputSignal<number> = input.required();
  contract = input<Contract>();

  tricksNS: Signal<number> = computed(() => {
    const tricks = this.playedTricks();
    return tricks.filter((trick) => trick.winner === 'North' || trick.winner === 'South').length;
  });

  tricksEW: Signal<number> = computed(() => {
    const tricks = this.playedTricks();
    return tricks.filter((trick) => trick.winner === 'East' || trick.winner === 'West').length;
  });
}
