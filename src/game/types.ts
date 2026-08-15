export type Suit = 'E' | 'G' | 'H' | 'S'
export type Rank = 'A' | '10' | 'K' | 'O' | 'U' | '9' | '8' | '7'
export type CardId = `${Suit}${Rank}`

export type PlayerId = 0 | 1 | 2 | 3

export type GameKind = 'rufspiel' | 'solo' | 'wenz'

export type Bid =
  | { kind: 'pass' }
  | { kind: 'rufspiel'; color: Exclude<Suit, 'H'> }
  | { kind: 'solo'; color: Suit }
  | { kind: 'wenz' }

export type Contract =
  | { kind: 'rufspiel'; color: Exclude<Suit, 'H'>; caller: PlayerId; partner: PlayerId; calledAce: CardId }
  | { kind: 'solo'; color: Suit; caller: PlayerId }
  | { kind: 'wenz'; caller: PlayerId }

export type Phase = 'idle' | 'bidding' | 'playing' | 'finished'

export interface TrickCard {
  player: PlayerId
  card: CardId
}

export interface FinishedTrick {
  cards: TrickCard[]
  winner: PlayerId
  points: number
}

export interface SeatScore {
  player: PlayerId
  delta: number
}

export interface GameResult {
  contract: Contract
  playingTeam: PlayerId[]
  defendingTeam: PlayerId[]
  playingPoints: number
  defendingPoints: number
  playingWon: boolean
  schneider: boolean
  schwarz: boolean
  seatDeltas: SeatScore[]
  message: string
}

export interface PublicState {
  phase: Phase
  hands: Record<PlayerId, CardId[]>
  bids: Partial<Record<PlayerId, Bid>>
  currentBidder: PlayerId | null
  highestBid: Bid | null
  contract: Contract | null
  currentTrick: TrickCard[]
  trickLeader: PlayerId
  finishedTricks: FinishedTrick[]
  whoseTurn: PlayerId | null
  dealer: PlayerId
  result: GameResult | null
  sessionScores: number[]
  calledAcePlayed: boolean
  awaitingContinue: boolean
  logLines: string[]
  message: string
}

export const SUITS: Suit[] = ['E', 'G', 'H', 'S']
export const RANKS: Rank[] = ['A', '10', 'K', 'O', 'U', '9', '8', '7']
export const PLAYERS: PlayerId[] = [0, 1, 2, 3]

export const PLAYER_NAMES: Record<PlayerId, string> = {
  0: 'Du',
  1: 'Sepp',
  2: 'Hias',
  3: 'Wastl',
}

export const SUIT_NAMES: Record<Suit, string> = {
  E: 'Eichel',
  G: 'Gras',
  H: 'Herz',
  S: 'Schellen',
}

export const RANK_NAMES: Record<Rank, string> = {
  A: 'Sau',
  '10': 'Zehn',
  K: 'König',
  O: 'Ober',
  U: 'Unter',
  '9': 'Neun',
  '8': 'Acht',
  '7': 'Sieben',
}
