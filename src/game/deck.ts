import type { CardId, Rank, Suit } from './types'
import { RANKS, SUITS } from './types'

export function parseCard(card: CardId): { suit: Suit; rank: Rank } {
  const suit = card[0] as Suit
  const rank = card.slice(1) as Rank
  return { suit, rank }
}

export function makeCard(suit: Suit, rank: Rank): CardId {
  return `${suit}${rank}` as CardId
}

export function cardPoints(card: CardId): number {
  const { rank } = parseCard(card)
  switch (rank) {
    case 'A':
      return 11
    case '10':
      return 10
    case 'K':
      return 4
    case 'O':
      return 3
    case 'U':
      return 2
    default:
      return 0
  }
}

export function createDeck(): CardId[] {
  const deck: CardId[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(suit, rank))
    }
  }
  return deck
}

/** Fisher–Yates with optional seeded RNG (0..1). */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function dealHands(random: () => number = Math.random): [CardId[], CardId[], CardId[], CardId[]] {
  const deck = shuffle(createDeck(), random)
  return [deck.slice(0, 8), deck.slice(8, 16), deck.slice(16, 24), deck.slice(24, 32)]
}

export function cardLabel(card: CardId): string {
  const { suit, rank } = parseCard(card)
  const suitGlyph: Record<Suit, string> = { E: 'Eichel', G: 'Gras', H: 'Herz', S: 'Schellen' }
  const rankGlyph: Record<Rank, string> = {
    A: 'A',
    '10': '10',
    K: 'K',
    O: 'O',
    U: 'U',
    '9': '9',
    '8': '8',
    '7': '7',
  }
  return `${suitGlyph[suit]} ${rankGlyph[rank]}`
}
