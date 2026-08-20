import { find } from 'rxjs';
import { Suit, HandName } from './card.util';

export type BiddingDenomination = Suit | 'NT' | 'pass' | 'double' | 'redouble';

export type BiddingValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'PASS' | 'X' | 'XX';

export interface Bidding {
  bidder: HandName;
  biddingValue: BiddingValue;
  denomination?: BiddingDenomination;
  symbol?: '♠' | '♥' | '♦' | '♣' | 'BA';
  alertInfo?: string;
}

export interface Contract extends Bidding {
  isDoubled: boolean;
  isRedoubled: boolean;
  declarer: HandName;
}

export const BiddingDenominationToSuitMap: Map<BiddingDenomination, Suit> = new Map([
  ['clubs', 'clubs'],
  ['spades', 'spades'],
  ['diamonds', 'diamonds'],
  ['hearts', 'hearts'],
]);

export const BiddingDenominationSeniorityMap: Map<BiddingDenomination, number> = new Map([
  ['clubs', 1],
  ['diamonds', 2],
  ['hearts', 3],
  ['spades', 4],
  ['NT', 5],
]);

export const BiddingDenominationSymbolMap: Map<BiddingDenomination, '♠' | '♥' | '♦' | '♣' | 'BA'> =
  new Map([
    ['spades', '♠'],
    ['hearts', '♥'],
    ['diamonds', '♦'],
    ['clubs', '♣'],
    ['NT', 'BA'],
  ]);

export const specialBiddingValueDenominationMap: Map<BiddingValue, BiddingDenomination> = new Map([
  ['PASS', 'pass'],
  ['X', 'double'],
  ['XX', 'redouble'],
]);

export function createBidding(
  bidder: HandName,
  biddingValue: BiddingValue,
  denomination?: BiddingDenomination,
): Bidding {
  return {
    bidder,
    biddingValue,
    denomination,
    symbol: denomination ? BiddingDenominationSymbolMap.get(denomination) : undefined,
  };
}

export function createContract(
  bid: Bidding,
  declarer: HandName,
  isDoubled?: boolean,
  isRedoubled?: boolean,
): Contract {
  return {
    ...bid,
    declarer,
    isDoubled: (isDoubled ?? false) || (isRedoubled ?? false),
    isRedoubled: isRedoubled ?? false,
  };
}

export function lastNotPass(biddingHistory: Bidding[]): Bidding | null {
  return biddingHistory.filter((bid) => bid.biddingValue !== 'PASS').slice(-1)[0] || null;
}

export function isLastBidderEnemy(bidding: Bidding, hand: HandName): boolean {
  switch (hand) {
    case 'North':
    case 'South':
      return bidding.bidder === 'East' || bidding.bidder === 'West';
    case 'East':
    case 'West':
      return bidding.bidder === 'North' || bidding.bidder === 'South';
  }
}

export function calculateMinLevel(biddingHistory: Bidding[]): number {
  const lastBiddedValue = biddingHistory
    .filter(
      (bid) => bid.biddingValue !== 'PASS' && bid.biddingValue !== 'X' && bid.biddingValue !== 'XX',
    )
    .slice(-1)[0];
  let result = 1;
  if (lastBiddedValue) {
    result = lastBiddedValue.biddingValue as number;
    if (lastBiddedValue.denomination === 'NT') {
      result++;
    }
  }
  return result;
}

export function lastBiddedDenominationSeniority(biddingHistory: Bidding[]): number {
  const lastBiddedValue = biddingHistory
    .filter(
      (bid) => bid.biddingValue !== 'PASS' && bid.biddingValue !== 'X' && bid.biddingValue !== 'XX',
    )
    .slice(-1)[0];
  return lastBiddedValue
    ? (BiddingDenominationSeniorityMap.get(lastBiddedValue.denomination ?? 'spades') ?? 0)
    : 0;
}

export function isBiddingPhaseOver(biddingHistory: Bidding[], lastBid: Bidding): boolean {
  const biddingLength = biddingHistory.length;
  if (lastBid.biddingValue === 'PASS' && biddingLength >= 4) {
    if (biddingLength === 4 && biddingHistory[0].biddingValue === 'PASS') {
      return areLastBidsPASS(biddingHistory, 4);
    } else {
      return areLastBidsPASS(biddingHistory, 3);
    }
  }
  return false;
}

function areLastBidsPASS(biddingHistory: Bidding[], count: number): boolean {
  return biddingHistory.slice(-count).every((bid) => bid.biddingValue === 'PASS');
}

export function findHighestBid(biddingHistory: Bidding[]): Bidding | undefined {
  return biddingHistory
    .filter(
      (bid) => bid.biddingValue !== 'PASS' && bid.biddingValue !== 'X' && bid.biddingValue !== 'XX',
    )
    .slice(-1)[0];
}

export function findDeclarer(biddingHistory: Bidding[], highestBid: Bidding): HandName {
  let laneBidHistory: Bidding[] = [];
  switch (highestBid.bidder) {
    case 'North':
    case 'South':
      laneBidHistory = biddingHistory.filter(
        (bid) => bid.bidder === 'North' || bid.bidder === 'South',
      );
      break;
    case 'East':
    case 'West':
      laneBidHistory = biddingHistory.filter(
        (bid) => bid.bidder === 'East' || bid.bidder === 'West',
      );
      break;
  }
  return (
    laneBidHistory.find((bid) => bid.denomination === highestBid.denomination)?.bidder ??
    highestBid.bidder
  );
}

export function isContractDoubledOrRedoubled(
  biddingHistory: Bidding[],
  highestBid: Bidding,
): null | 'X' | 'XX' {
  const contractIndex = biddingHistory.findIndex(
    (bid) =>
      bid.biddingValue === highestBid.biddingValue &&
      bid.bidder === highestBid.bidder &&
      bid.denomination === highestBid.denomination,
  );
  const biddingAfterContract = biddingHistory.slice(contractIndex);
  return biddingAfterContract.find((b) => b.biddingValue === 'XX') != null
    ? 'XX'
    : biddingAfterContract.find((b) => b.biddingValue === 'X') != null
      ? 'X'
      : null;
}
