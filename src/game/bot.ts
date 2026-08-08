import { cardPoints, parseCard } from './deck'
import { beats, effectiveColor, isTrump, trumpOrder } from './ordering'
import { bidRank, callableColors, canAnnounce, legalMoves } from './rules'
import type { Bid, CardId, Contract, PlayerId, Suit } from './types'

function trumpCount(hand: CardId[], asIf: Contract): number {
  return hand.filter((c) => isTrump(c, asIf)).length
}

function highTrumps(hand: CardId[]): number {
  const tops = ['EO', 'GO', 'HO', 'SO', 'EU', 'GU'] as CardId[]
  return hand.filter((c) => tops.includes(c)).length
}

export function chooseBid(hand: CardId[], current: Bid | null): Bid {
  const highs = highTrumps(hand)
  const unter = hand.filter((c) => parseCard(c).rank === 'U').length

  // Wenz: strong unters
  const wenzBid: Bid = { kind: 'wenz' }
  if (unter >= 3 && canAnnounce(hand, wenzBid, current)) {
    return wenzBid
  }

  // Solo: many trumps in a color
  const suits: Suit[] = ['E', 'G', 'H', 'S']
  let bestSolo: { color: Suit; trumps: number } | null = null
  for (const color of suits) {
    const probe: Contract = { kind: 'solo', color, caller: 0 }
    const t = trumpCount(hand, probe)
    if (!bestSolo || t > bestSolo.trumps) bestSolo = { color, trumps: t }
  }
  if (bestSolo && bestSolo.trumps >= 7 && highs >= 2) {
    const soloBid: Bid = { kind: 'solo', color: bestSolo.color }
    if (canAnnounce(hand, soloBid, current)) return soloBid
  }

  // Rufspiel
  if (!current || bidRank(current) < 1) {
    const probe: Contract = {
      kind: 'rufspiel',
      color: 'E',
      caller: 0,
      partner: 1,
      calledAce: 'EA',
    }
    const trumps = trumpCount(hand, probe)
    const colors = callableColors(hand)
    if (trumps >= 5 && highs >= 1 && colors.length > 0) {
      // Prefer color with fewer plain cards (shorter side suit to call)
      const color = [...colors].sort((a, b) => {
        const ca = hand.filter((c) => effectiveColor(c, probe) === a).length
        const cb = hand.filter((c) => effectiveColor(c, probe) === b).length
        return ca - cb
      })[0]
      return { kind: 'rufspiel', color }
    }
  }

  return { kind: 'pass' }
}

function partnerKnown(contract: Contract, player: PlayerId): PlayerId | null {
  if (contract.kind !== 'rufspiel') return null
  if (player === contract.caller) return contract.partner
  if (player === contract.partner) return contract.caller
  return null
}

function onPlayingTeam(contract: Contract, player: PlayerId): boolean {
  if (contract.kind === 'rufspiel') {
    return player === contract.caller || player === contract.partner
  }
  return player === contract.caller
}

export function chooseCard(
  hand: CardId[],
  contract: Contract,
  trick: { player: PlayerId; card: CardId }[],
  player: PlayerId,
  calledAcePlayed: boolean,
): CardId {
  const legal = legalMoves(
    hand,
    contract,
    trick,
    calledAcePlayed,
  )
  if (legal.length === 1) return legal[0]

  const partner = partnerKnown(contract, player)
  const amPlaying = onPlayingTeam(contract, player)

  // Leading: prefer low non-trump or medium trump
  if (trick.length === 0) {
    const nonTrump = legal.filter((c) => !isTrump(c, contract))
    if (nonTrump.length) {
      return [...nonTrump].sort((a, b) => cardPoints(a) - cardPoints(b))[0]
    }
    const order = trumpOrder(contract)
    return [...legal].sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] // low trump
  }

  const currentWinner = (() => {
    let best = trick[0]
    for (let i = 1; i < trick.length; i++) {
      if (beats(best.card, trick[i].card, contract)) best = trick[i]
    }
    return best
  })()

  const partnerWinning = partner !== null && currentWinner.player === partner
  const teamWinning =
    partnerWinning ||
    (amPlaying && onPlayingTeam(contract, currentWinner.player) && currentWinner.player !== player) ||
    (!amPlaying && !onPlayingTeam(contract, currentWinner.player) && currentWinner.player !== player)

  const winningCards = legal.filter((c) => beats(currentWinner.card, c, contract))

  // Last to play and can win: take if valuable or needed
  if (trick.length === 3 && winningCards.length) {
    if (!teamWinning) {
      return [...winningCards].sort((a, b) => cardPoints(a) - cardPoints(b))[0]
    }
  }

  // Partner winning: dump junk / schmieren points if useful
  if (teamWinning) {
    const points = [...legal].sort((a, b) => cardPoints(b) - cardPoints(a))
    // Schmieren Augen if partner winning and we have A/10
    if (points[0] && cardPoints(points[0]) >= 10) return points[0]
    return [...legal].sort((a, b) => cardPoints(a) - cardPoints(b))[0]
  }

  // Can win the trick
  if (winningCards.length) {
    // Prefer cheapest winner
    return [...winningCards].sort((a, b) => cardPoints(a) - cardPoints(b))[0]
  }

  // Must lose: dump lowest points
  return [...legal].sort((a, b) => cardPoints(a) - cardPoints(b))[0]
}
