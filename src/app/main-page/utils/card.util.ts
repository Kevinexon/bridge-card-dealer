export type HandName = 'North' | 'East' | 'South' | 'West';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type CardName = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export const CardValueMap: Map<CardName, number> = new Map([
  ['2', 2],
  ['3', 3],
  ['4', 4],
  ['5', 5],
  ['6', 6],
  ['7', 7],
  ['8', 8],
  ['9', 9],
  ['10', 10],
  ['J', 11],
  ['Q', 12],
  ['K', 13],
  ['A', 14],
]);

export const SuitSymbolMap: Map<Suit, '♠' | '♥' | '♦' | '♣'> = new Map([
  ['spades', '♠'],
  ['hearts', '♥'],
  ['diamonds', '♦'],
  ['clubs', '♣'],
]);

export interface Card {
  sortValue: number;
  suit: Suit;
  name: CardName;
  symbol: '♠' | '♥' | '♦' | '♣';
  imgUrl: string;
  hand: HandName;
  isPlayed?: boolean;
}

export function createCard(suit: Suit, name: CardName): Card {
  return {
    suit,
    name,
    hand: 'North',
    sortValue: CardValueMap.get(name) ?? 2,
    symbol: SuitSymbolMap.get(suit) ?? '♠',
    imgUrl: `cards/${suit}_${name}.jpg`,
  };
}

export function createDeck(): Card[] {
  return [
    ...['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].flatMap((name) =>
      ['spades', 'hearts', 'diamonds', 'clubs'].map((suit) =>
        createCard(suit as Suit, name as CardName),
      ),
    ),
  ];
}

// export function createDeck(): Card[] {
//   return [
//     ...['spades', 'hearts', 'diamonds', 'clubs'].flatMap((suit) =>
//       ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].map((name) =>
//         createCard(suit as Suit, name as CardName),
//       ),
//     ),
//   ];
// }

// "Zeberka": kolory w rece maja sie przeplatac czarny-czerwony, zeby dwa
// czerwone nigdy nie stykaly sie ze soba. Gdy jest atu, idzie on pierwszy,
// a przeplot obowiazuje dalej. W obrebie jednej barwy starszy kolor idzie
// przed mlodszym (pik przed treflem, kier przed karem).
const blackSuits: Suit[] = ['spades', 'clubs'];
const redSuits: Suit[] = ['hearts', 'diamonds'];

function isBlackSuit(suit: Suit): boolean {
  return blackSuits.includes(suit);
}

export function suitDisplayOrder(trump?: Suit | null): Suit[] {
  const black = blackSuits.filter((suit) => suit !== trump);
  const red = redSuits.filter((suit) => suit !== trump);
  const order: Suit[] = trump ? [trump] : [];
  // Bez atu zaczynamy od czarnego; z atu — od barwy przeciwnej do atu.
  let takeBlack = trump ? !isBlackSuit(trump) : true;

  while (black.length > 0 || red.length > 0) {
    order.push((takeBlack ? black : red).shift()!);
    takeBlack = !takeBlack;
  }
  return order;
}
