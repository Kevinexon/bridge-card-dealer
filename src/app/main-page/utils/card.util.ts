export type HandName = 'North' | 'East' | 'South' | 'West';

export type CardColor = 'spades' | 'hearts' | 'diamonds' | 'clubs';

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

export const CardColorSymbolMap: Map<CardColor, '♠' | '♥' | '♦' | '♣'> = new Map([
  ['spades', '♠'],
  ['hearts', '♥'],
  ['diamonds', '♦'],
  ['clubs', '♣'],
]);

export interface Card {
  sortValue: number;
  color: CardColor;
  name: CardName;
  suit: '♠' | '♥' | '♦' | '♣';
  imgUrl: string;
  hand: HandName;
  isPlayed?: boolean;
}

export function createCard(color: CardColor, name: CardName): Card {
  return {
    color,
    name,
    hand: 'North',
    sortValue: CardValueMap.get(name) ?? 2,
    suit: CardColorSymbolMap.get(color) ?? '♠',
    imgUrl: `cards/${color}_${name}.jpg`,
  };
}

// export function createDeck(): Card[] {
//   return [
//     ...['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].flatMap((name) =>
//       ['spades', 'hearts', 'diamonds', 'clubs'].map((color) =>
//         createCard(color as CardColor, name as CardName),
//       ),
//     ),
//   ];
// }

export function createDeck(): Card[] {
  return [
    ...['spades', 'hearts', 'diamonds', 'clubs'].flatMap((color) =>
      ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].map((name) =>
        createCard(color as CardColor, name as CardName),
      ),
    ),
  ];
}
