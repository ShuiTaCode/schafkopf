import { makeCard, parseCard } from './deck'
import type { CardId, Contract, Rank, Suit } from './types'

export type EffectiveColor = Suit | 'TRUMP'

const COLOR_ORDER_NORMAL: Rank[] = ['A', '10', 'K', '9', '8', '7']
const COLOR_ORDER_WENZ: Rank[] = ['A', '10', 'K', 'O', '9', '8', '7']

function oberUnter(): CardId[] {
  return [
    makeCard('E', 'O'),
    makeCard('G', 'O'),
    makeCard('H', 'O'),
    makeCard('S', 'O'),
    makeCard('E', 'U'),
    makeCard('G', 'U'),
    makeCard('H', 'U'),
    makeCard('S', 'U'),
  ]
}

function unterOnly(): CardId[] {
  return [makeCard('E', 'U'), makeCard('G', 'U'), makeCard('H', 'U'), makeCard('S', 'U')]
}

function colorCardsWithoutOberUnter(suit: Suit): CardId[] {
  return COLOR_ORDER_NORMAL.map((rank) => makeCard(suit, rank))
}

export function trumpOrder(contract: Contract): CardId[] {
  if (contract.kind === 'rufspiel') {
    return [...oberUnter(), ...colorCardsWithoutOberUnter('H')]
  }
  if (contract.kind === 'solo') {
    return [...oberUnter(), ...colorCardsWithoutOberUnter(contract.color)]
  }
  return unterOnly()
}

export function isTrump(card: CardId, contract: Contract): boolean {
  return trumpOrder(contract).includes(card)
}

export function effectiveColor(card: CardId, contract: Contract): EffectiveColor {
  if (isTrump(card, contract)) return 'TRUMP'
  return parseCard(card).suit
}

export function colorOrder(suit: Suit, contract: Contract): CardId[] {
  if (contract.kind === 'wenz') {
    return COLOR_ORDER_WENZ.map((rank) => makeCard(suit, rank))
  }
  // In Rufspiel Herz and Solo trump color are not "colors"
  if (contract.kind === 'rufspiel' && suit === 'H') return []
  if (contract.kind === 'solo' && suit === contract.color) return []
  return colorCardsWithoutOberUnter(suit)
}

/** Returns true if `challenger` beats `leader` (same trick semantics). */
export function beats(leader: CardId, challenger: CardId, contract: Contract): boolean {
  const leadTrump = isTrump(leader, contract)
  const challTrump = isTrump(challenger, contract)

  if (leadTrump && challTrump) {
    return trumpOrder(contract).indexOf(challenger) < trumpOrder(contract).indexOf(leader)
  }
  if (!leadTrump && challTrump) return true
  if (leadTrump && !challTrump) return false

  const leadColor = parseCard(leader).suit
  const challColor = parseCard(challenger).suit
  if (leadColor !== challColor) return false

  const order = colorOrder(leadColor, contract)
  return order.indexOf(challenger) < order.indexOf(leader)
}

export function trickWinner(cards: { player: number; card: CardId }[], contract: Contract): number {
  let best = cards[0]
  for (let i = 1; i < cards.length; i++) {
    if (beats(best.card, cards[i].card, contract)) {
      best = cards[i]
    }
  }
  return best.player
}

/** Beim Geben wie Rufspiel sortieren: Ober, Unter, Herz, dann Fehlfarben. */
const DEFAULT_HAND_CONTRACT: Contract = {
  kind: 'rufspiel',
  color: 'E',
  caller: 0,
  partner: 1,
  calledAce: 'EA',
}

export function sortHand(cards: CardId[], contract: Contract | null): CardId[] {
  const by = contract ?? DEFAULT_HAND_CONTRACT
  const trumps = trumpOrder(by)
  return [...cards].sort((a, b) => {
    const ta = isTrump(a, by)
    const tb = isTrump(b, by)
    if (ta && tb) return trumps.indexOf(a) - trumps.indexOf(b)
    if (ta) return -1
    if (tb) return 1
    const pa = parseCard(a)
    const pb = parseCard(b)
    if (pa.suit !== pb.suit) {
      const order: Suit[] = ['E', 'G', 'H', 'S']
      return order.indexOf(pa.suit) - order.indexOf(pb.suit)
    }
    return colorOrder(pa.suit, by).indexOf(a) - colorOrder(pb.suit, by).indexOf(b)
  })
}
