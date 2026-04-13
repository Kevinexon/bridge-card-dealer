import {
  Component,
  computed,
  input,
  InputSignal,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { HandName } from '../../utils/card.util';
import { Trick } from '../../utils/trick.util';

@Component({
  selector: 'app-tricks-count',
  imports: [],
  templateUrl: './tricks-count.html',
  styleUrl: './tricks-count.css',
})
export class TricksCount {
  playedTricks: InputSignal<Trick[]> = input.required();

  contract: WritableSignal<string> = signal('');
  declarer: WritableSignal<string> = signal('');

  tricksNS: Signal<number> = computed(() => {
    const tricks = this.playedTricks();
    return tricks.filter((trick) => trick.winner === 'North' || trick.winner === 'South').length;
  });

  tricksEW: Signal<number> = computed(() => {
    const tricks = this.playedTricks();
    return tricks.filter((trick) => trick.winner === 'East' || trick.winner === 'West').length;
  });
}
