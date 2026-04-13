import { Card, HandName } from './card.util';

export interface Trick {
  playedCards: Card[];
  winner?: HandName;
}
