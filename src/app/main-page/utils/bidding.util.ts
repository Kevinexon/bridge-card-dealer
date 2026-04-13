import { CardColor, HandName } from './card.util';

export type BiddingSuit = CardColor | 'BA';

export interface Bidding {
  bidder: HandName;
  isPass: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  suit?: BiddingSuit;
}
