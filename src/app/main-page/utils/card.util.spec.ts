import { createCard, createDeck } from './card.util';

describe('createCard', () => {
  it('maps rank to sort value', () => {
    expect(createCard('spades', 'A').sortValue).toBe(14);
    expect(createCard('spades', '10').sortValue).toBe(10);
    expect(createCard('spades', '2').sortValue).toBe(2);
  });

  it('maps suit to its symbol', () => {
    expect(createCard('spades', 'A').suit).toBe('♠');
    expect(createCard('hearts', 'A').suit).toBe('♥');
    expect(createCard('diamonds', 'A').suit).toBe('♦');
    expect(createCard('clubs', 'A').suit).toBe('♣');
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
      expect(deck.filter((card) => card.color === suit)).toHaveLength(13);
    }
  });

  it('creates no duplicates', () => {
    const deck = createDeck();
    const keys = new Set(deck.map((card) => `${card.color}_${card.name}`));
    expect(keys.size).toBe(52);
  });

  it('orders the deck so that dealing by index gives each seat one whole suit', () => {
    // Utrwala obecne, deterministyczne zachowanie dealNewDeck() — patrz spec sekcja 3.
    // Zmiana tego testu musi byc swiadoma decyzja, nie cicha regresja.
    const deck = createDeck();
    const seats = ['North', 'East', 'South', 'West'] as const;
    const suitsPerSeat = seats.map(
      (_, seatIndex) => new Set(deck.filter((_, i) => i % 4 === seatIndex).map((c) => c.color)),
    );
    expect(suitsPerSeat.map((s) => [...s])).toEqual([
      ['spades'],
      ['hearts'],
      ['diamonds'],
      ['clubs'],
    ]);
  });
});
