import { makeCard, parseCard } from './deck'
import { effectiveColor } from './ordering'
import type { Bid, CardId, Contract, Suit } from './types'
import { SUIT_NAMES } from './types'

export function hasPlainColor(hand: CardId[], color: Suit): boolean {
  // Without contract yet (bidding), O/U are not yet assigned as trump for color check of "callable"
  return hand.some((c) => {
    const { suit, rank } = parseCard(c)
    if (suit !== color) return false
    if (rank === 'O' || rank === 'U') return false
    return true
  })
}

export function canCallColor(hand: CardId[], color: Exclude<Suit, 'H'>): boolean {
  const ace = makeCard(color, 'A')
  if (hand.includes(ace)) return false
  return hasPlainColor(hand, color)
}

export function callableColors(hand: CardId[]): Array<Exclude<Suit, 'H'>> {
  return (['E', 'G', 'S'] as const).filter((c) => canCallColor(hand, c))
}

/** Warum ein Rufspiel nicht geht — nur Anzeige, ändert die Regel nicht. */
export function rufspielBlockReason(hand: CardId[], color: Exclude<Suit, 'H'>): string | null {
  if (canCallColor(hand, color)) return null
  if (hand.includes(makeCard(color, 'A'))) {
    return `Du hast die ${SUIT_NAMES[color]}-Sau selbst.`
  }
  return `Keine ${SUIT_NAMES[color]}-Fehlkarte auf der Hand.`
}

/** Aufsteigend: Rufspiel < Wenz < Farbsolo (Schafkopfordnung). */
export function bidRank(bid: Bid): number {
  if (bid.kind === 'pass') return 0
  if (bid.kind === 'rufspiel') return 1
  if (bid.kind === 'wenz') return 2
  return 3 // solo
}

export function canAnnounce(hand: CardId[], bid: Bid, current: Bid | null): boolean {
  if (bid.kind === 'pass') return true
  if (current && bidRank(bid) <= bidRank(current)) return false
  if (bid.kind === 'rufspiel') return canCallColor(hand, bid.color)
  return true
}

function calledAce(contract: Contract): CardId | null {
  if (contract.kind !== 'rufspiel') return null
  return contract.calledAce
}

function cardsOfEffectiveColor(hand: CardId[], color: ReturnType<typeof effectiveColor>, contract: Contract): CardId[] {
  return hand.filter((c) => effectiveColor(c, contract) === color)
}

/**
 * Legal cards according to Bavarian Farb-/Trumpfzwang + Rufsau rules.
 */
export function legalMoves(
  hand: CardId[],
  contract: Contract,
  trick: { card: CardId }[],
  calledAcePlayed: boolean,
): CardId[] {
  if (hand.length === 1) return [...hand]

  const ace = calledAce(contract)

  // Leading
  if (trick.length === 0) {
    if (contract.kind === 'rufspiel' && ace && !calledAcePlayed) {
      const callColor = contract.color
      const callColorCards = cardsOfEffectiveColor(hand, callColor, contract)
      // Davonlaufen: with 4+ of the called color (effective), may lead them without Ace
      const mayRunAway = callColorCards.length >= 4
      return hand.filter((card) => {
        const isCallColor = effectiveColor(card, contract) === callColor
        if (!isCallColor) return true
        if (card === ace) return true
        // Leading called color without Ace only if davonlaufen or you don't have Ace
        if (!hand.includes(ace)) return true
        return mayRunAway
      })
    }
    return [...hand]
  }

  const lead = trick[0].card
  const leadColor = effectiveColor(lead, contract)
  const matching = cardsOfEffectiveColor(hand, leadColor, contract)

  let candidates: CardId[]
  if (matching.length > 0) {
    candidates = matching
  } else {
    candidates = [...hand]
  }

  // Rufsau: must play Ace when called color is led; must not discard Ace on other colors
  if (contract.kind === 'rufspiel' && ace && hand.includes(ace) && !calledAcePlayed) {
    if (leadColor === contract.color) {
      // Must play the Ace if you can follow (you have Ace which is of that color)
      if (candidates.includes(ace)) {
        return [ace]
      }
    } else {
      // Cannot schmieren the Ace away on another lead
      candidates = candidates.filter((c) => c !== ace)
      if (candidates.length === 0) {
        // Only Ace left as escape — allow it
        return [ace]
      }
    }
  }

  return candidates
}

export function findPartner(hands: Record<number, CardId[]>, caller: number, calledAce: CardId): number {
  for (const p of [0, 1, 2, 3] as const) {
    if (p === caller) continue
    if (hands[p].includes(calledAce)) return p
  }
  throw new Error('Called ace not found in any hand')
}

export function resolveContract(
  bid: Bid,
  caller: number,
  hands: Record<number, CardId[]>,
): Contract {
  if (bid.kind === 'pass') throw new Error('Cannot resolve pass')
  if (bid.kind === 'wenz') return { kind: 'wenz', caller: caller as 0 | 1 | 2 | 3 }
  if (bid.kind === 'solo') return { kind: 'solo', color: bid.color, caller: caller as 0 | 1 | 2 | 3 }
  const calledAce = makeCard(bid.color, 'A')
  const partner = findPartner(hands, caller, calledAce) as 0 | 1 | 2 | 3
  return {
    kind: 'rufspiel',
    color: bid.color,
    caller: caller as 0 | 1 | 2 | 3,
    partner,
    calledAce,
  }
}

export function playingTeam(contract: Contract): number[] {
  if (contract.kind === 'rufspiel') return [contract.caller, contract.partner]
  return [contract.caller]
}
