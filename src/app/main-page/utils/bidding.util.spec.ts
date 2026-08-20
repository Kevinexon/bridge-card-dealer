import {
  Bidding,
  calculateMinLevel,
  createBidding,
  createContract,
  findDeclarer,
  findHighestBid,
  isBiddingPhaseOver,
  isContractDoubledOrRedoubled,
  isLastBidderEnemy,
  lastBiddedDenominationSeniority,
  lastNotPass,
} from './bidding.util';

const pass = (bidder: Bidding['bidder']) => createBidding(bidder, 'PASS', 'pass');

describe('lastNotPass', () => {
  it('returns null for an empty history', () => {
    expect(lastNotPass([])).toBeNull();
  });

  it('returns null when everyone passed', () => {
    expect(lastNotPass([pass('North'), pass('East')])).toBeNull();
  });

  it('returns the most recent non-pass call', () => {
    const history = [createBidding('North', 1, 'clubs'), pass('East')];
    expect(lastNotPass(history)?.denomination).toBe('clubs');
  });
});

describe('isLastBidderEnemy', () => {
  it('treats the other partnership as opponents', () => {
    expect(isLastBidderEnemy(createBidding('East', 1, 'clubs'), 'North')).toBe(true);
    expect(isLastBidderEnemy(createBidding('West', 1, 'clubs'), 'South')).toBe(true);
    expect(isLastBidderEnemy(createBidding('North', 1, 'clubs'), 'East')).toBe(true);
  });

  it('treats partner and self as allies', () => {
    expect(isLastBidderEnemy(createBidding('South', 1, 'clubs'), 'North')).toBe(false);
    expect(isLastBidderEnemy(createBidding('North', 1, 'clubs'), 'North')).toBe(false);
  });
});

describe('calculateMinLevel', () => {
  it('starts at level 1', () => {
    expect(calculateMinLevel([])).toBe(1);
  });

  it('stays at the last bid level for suit contracts', () => {
    expect(calculateMinLevel([createBidding('North', 1, 'spades')])).toBe(1);
    expect(calculateMinLevel([createBidding('North', 3, 'hearts')])).toBe(3);
  });

  it('raises the level after notrump, since nothing outranks NT at that level', () => {
    expect(calculateMinLevel([createBidding('North', 1, 'NT')])).toBe(2);
  });

  it('ignores passes, doubles and redoubles', () => {
    const history = [
      createBidding('North', 2, 'diamonds'),
      createBidding('East', 'X', 'double'),
      pass('South'),
    ];
    expect(calculateMinLevel(history)).toBe(2);
  });
});

describe('lastBiddedDenominationSeniority', () => {
  it('returns 0 when nothing was bid', () => {
    expect(lastBiddedDenominationSeniority([])).toBe(0);
  });

  it('ranks clubs below diamonds below hearts below spades below notrump', () => {
    expect(lastBiddedDenominationSeniority([createBidding('North', 1, 'clubs')])).toBe(1);
    expect(lastBiddedDenominationSeniority([createBidding('North', 1, 'diamonds')])).toBe(2);
    expect(lastBiddedDenominationSeniority([createBidding('North', 1, 'hearts')])).toBe(3);
    expect(lastBiddedDenominationSeniority([createBidding('North', 1, 'spades')])).toBe(4);
    expect(lastBiddedDenominationSeniority([createBidding('North', 1, 'NT')])).toBe(5);
  });
});

describe('isBiddingPhaseOver', () => {
  it('does not end the auction before four calls', () => {
    const history = [createBidding('North', 1, 'spades'), pass('East'), pass('South')];
    expect(isBiddingPhaseOver(history, history[2])).toBe(false);
  });

  it('ends the auction on three passes following a bid', () => {
    const history = [
      createBidding('North', 1, 'spades'),
      pass('East'),
      pass('South'),
      pass('West'),
    ];
    expect(isBiddingPhaseOver(history, history[3])).toBe(true);
  });

  it('ends the auction when all four players pass', () => {
    const history = [pass('North'), pass('East'), pass('South'), pass('West')];
    expect(isBiddingPhaseOver(history, history[3])).toBe(true);
  });
});

describe('findHighestBid', () => {
  it('returns the last real bid, ignoring passes and doubles', () => {
    const history = [
      createBidding('North', 1, 'clubs'),
      createBidding('East', 2, 'hearts'),
      createBidding('South', 'X', 'double'),
      pass('West'),
    ];
    expect(findHighestBid(history)?.denomination).toBe('hearts');
  });

  it('returns undefined for a passed-out auction', () => {
    // Sygnatura mowi `Bidding | undefined` wlasnie dlatego: przy samych pasach
    // nie ma najwyzszej odzywki, a endBiddingPhase musi to obsluzyc zamiast
    // przekazywac undefined do findDeclarer.
    const history = [pass('North'), pass('East'), pass('South'), pass('West')];
    expect(findHighestBid(history)).toBeUndefined();
  });
});

describe('findDeclarer', () => {
  it('names the partner who bid the contract suit first', () => {
    const history = [
      createBidding('North', 1, 'hearts'),
      pass('East'),
      createBidding('South', 2, 'hearts'),
      pass('West'),
    ];
    expect(findDeclarer(history, history[2])).toBe('North');
  });

  it('names the bidder when nobody in the partnership bid the suit earlier', () => {
    const history = [createBidding('East', 1, 'spades')];
    expect(findDeclarer(history, history[0])).toBe('East');
  });
});

describe('isContractDoubledOrRedoubled', () => {
  it('returns null for an undoubled contract', () => {
    const history = [createBidding('North', 1, 'spades'), pass('East')];
    expect(isContractDoubledOrRedoubled(history, history[0])).toBeNull();
  });

  it('detects a double', () => {
    const history = [createBidding('North', 1, 'spades'), createBidding('East', 'X', 'double')];
    expect(isContractDoubledOrRedoubled(history, history[0])).toBe('X');
  });

  it('detects a redouble', () => {
    const history = [
      createBidding('North', 1, 'spades'),
      createBidding('East', 'X', 'double'),
      createBidding('South', 'XX', 'redouble'),
    ];
    expect(isContractDoubledOrRedoubled(history, history[0])).toBe('XX');
  });

  it('ignores a double that was applied to an earlier contract', () => {
    // Bug 4: findIndex dopasowuje po biddingValue + bidder, z pominieciem koloru,
    // wiec trafia w 1 clubs zamiast w 1 spades i doklada kontre sprzed kontraktu.
    // Patrz bidding.util.ts:167.
    const history = [
      createBidding('North', 1, 'clubs'),
      createBidding('East', 'X', 'double'),
      createBidding('North', 1, 'spades'),
      pass('East'),
      pass('South'),
      pass('West'),
    ];
    expect(isContractDoubledOrRedoubled(history, history[2])).toBeNull();
  });
});

describe('createContract', () => {
  it('creates an undoubled contract', () => {
    const contract = createContract(createBidding('North', 4, 'spades'), 'North', false, false);
    expect(contract.isDoubled).toBe(false);
    expect(contract.isRedoubled).toBe(false);
    expect(contract.declarer).toBe('North');
  });

  it('creates a doubled contract', () => {
    const contract = createContract(createBidding('North', 4, 'spades'), 'North', true, false);
    expect(contract.isDoubled).toBe(true);
    expect(contract.isRedoubled).toBe(false);
  });

  it('marks a redoubled contract as doubled as well', () => {
    // Bug 3: isDoubled ?? isRedoubled ?? false — operator ?? nie lapie wartosci
    // false, bo false nie jest nullish, wiec kontrakt z rekontra raportuje
    // isDoubled: false. Patrz bidding.util.ts:73.
    const contract = createContract(createBidding('North', 4, 'spades'), 'North', false, true);
    expect(contract.isRedoubled).toBe(true);
    expect(contract.isDoubled).toBe(true);
  });
});
