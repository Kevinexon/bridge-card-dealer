import { createCard, createDeck, Suit, suitDisplayOrder } from './card.util';

describe('createCard', () => {
  it('maps rank to sort value', () => {
    expect(createCard('spades', 'A').sortValue).toBe(14);
    expect(createCard('spades', '10').sortValue).toBe(10);
    expect(createCard('spades', '2').sortValue).toBe(2);
  });

  it('maps suit to its symbol', () => {
    expect(createCard('spades', 'A').symbol).toBe('♠');
    expect(createCard('hearts', 'A').symbol).toBe('♥');
    expect(createCard('diamonds', 'A').symbol).toBe('♦');
    expect(createCard('clubs', 'A').symbol).toBe('♣');
  });

  it('builds the image path from suit and rank', () => {
    expect(createCard('clubs', 'K').imgUrl).toBe('cards/clubs_K.jpg');
  });

  it('starts every card in the North hand and unplayed', () => {
    const card = createCard('hearts', '7');
    expect(card.hand).toBe('North');
    expect(card.isPlayed).toBeUndefined();
  });
});

describe('createDeck', () => {
  it('creates 52 cards', () => {
    expect(createDeck()).toHaveLength(52);
  });

  it('creates 13 cards of each suit', () => {
    const deck = createDeck();
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      expect(deck.filter((card) => card.suit === suit)).toHaveLength(13);
    }
  });

  it('creates no duplicates', () => {
    const deck = createDeck();
    const keys = new Set(deck.map((card) => `${card.suit}_${card.name}`));
    expect(keys.size).toBe(52);
  });

  it('orders the deck so that dealing by index gives each seat one whole suit', () => {
    // Utrwala obecne, deterministyczne zachowanie dealNewDeck() — patrz spec sekcja 3.
    // Zmiana tego testu musi byc swiadoma decyzja, nie cicha regresja.
    const deck = createDeck();
    const seats = ['North', 'East', 'South', 'West'] as const;
    const suitsPerSeat = seats.map(
      (_, seatIndex) => new Set(deck.filter((_, i) => i % 4 === seatIndex).map((c) => c.suit)),
    );
    expect(suitsPerSeat.map((s) => [...s])).toEqual([
      ['spades'],
      ['hearts'],
      ['diamonds'],
      ['clubs'],
    ]);
  });
});

describe('suitDisplayOrder', () => {
  // "Zeberka": kolory maja sie przeplatac czarny-czerwony, zeby dwa czerwone
  // nigdy nie stykaly sie w rece. Prosba uczniow, nie kaprys stylistyczny.
  const isBlack = (suit: Suit) => suit === 'spades' || suit === 'clubs';

  it('alternates black and red suits when there is no trump', () => {
    expect(suitDisplayOrder()).toEqual(['spades', 'hearts', 'clubs', 'diamonds']);
  });

  it('puts the trump first and keeps alternating', () => {
    expect(suitDisplayOrder('diamonds')).toEqual(['diamonds', 'spades', 'hearts', 'clubs']);
    expect(suitDisplayOrder('hearts')).toEqual(['hearts', 'spades', 'diamonds', 'clubs']);
    expect(suitDisplayOrder('clubs')).toEqual(['clubs', 'hearts', 'spades', 'diamonds']);
    expect(suitDisplayOrder('spades')).toEqual(['spades', 'hearts', 'clubs', 'diamonds']);
  });

  it('never places two suits of the same colour next to each other', () => {
    const trumps: (Suit | undefined)[] = [undefined, 'spades', 'hearts', 'diamonds', 'clubs'];
    for (const trump of trumps) {
      const order = suitDisplayOrder(trump);
      for (let i = 1; i < order.length; i++) {
        expect(isBlack(order[i]), `${trump ?? 'brak atu'}: ${order.join(' ')}`).not.toBe(
          isBlack(order[i - 1]),
        );
      }
    }
  });

  it('returns all four suits exactly once for every trump', () => {
    for (const trump of ['spades', 'hearts', 'diamonds', 'clubs'] as Suit[]) {
      expect(new Set(suitDisplayOrder(trump)).size).toBe(4);
    }
  });
});
