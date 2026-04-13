import { Component, input } from '@angular/core';
import { Card } from '../../utils/card.util';

@Component({
  selector: 'app-play-area',
  imports: [],
  templateUrl: './play-area.html',
  styleUrl: './play-area.css',
})
export class PlayArea {
  playedCards = input.required<Card[]>();
}
