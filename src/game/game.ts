import { chooseBid, chooseCard } from './bot'
import { cardLabel, cardPoints, dealHands } from './deck'
import { sortHand, trickWinner } from './ordering'
import { legalMoves, resolveContract } from './rules'
import { scoreGame } from './scoring'
import type {
  Bid,
  CardId,
  Contract,
  FinishedTrick,
  GameResult,
  Phase,
  PlayerId,
  PublicState,
  TrickCard,
} from './types'
import { PLAYERS, PLAYER_NAMES, SUIT_NAMES } from './types'

const HUMAN: PlayerId = 0

function emptyHands(): Record<PlayerId, CardId[]> {
  return { 0: [], 1: [], 2: [], 3: [] }
}

export class SchafkopfGame {
  phase: Phase = 'idle'
  hands: Record<PlayerId, CardId[]> = emptyHands()
  bids: Partial<Record<PlayerId, Bid>> = {}
  currentBidder: PlayerId | null = null
  highestBid: Bid | null = null
  highestBidder: PlayerId | null = null
  contract: Contract | null = null
  currentTrick: TrickCard[] = []
  trickLeader: PlayerId = 0
  finishedTricks: FinishedTrick[] = []
  whoseTurn: PlayerId | null = null
  dealer: PlayerId = 3
  result: GameResult | null = null
  sessionScores: number[] = [0, 0, 0, 0]
  calledAcePlayed = false
  awaitingContinue = false
  logLines: string[] = []
  message = 'Bereit für eine neue Runde.'
  private passesInRow = 0
  private biddingOrder: PlayerId[] = []
  private biddingIndex = 0

  getState(): PublicState {
    return {
      phase: this.phase,
      hands: {
        0: [...this.hands[0]],
        1: [...this.hands[1]],
        2: [...this.hands[2]],
        3: [...this.hands[3]],
      },
      bids: { ...this.bids },
      currentBidder: this.currentBidder,
      highestBid: this.highestBid,
      contract: this.contract,
      currentTrick: [...this.currentTrick],
      trickLeader: this.trickLeader,
      finishedTricks: this.finishedTricks.map((t) => ({
        ...t,
        cards: [...t.cards],
      })),
      whoseTurn: this.whoseTurn,
      dealer: this.dealer,
      result: this.result,
      sessionScores: [...this.sessionScores],
      calledAcePlayed: this.calledAcePlayed,
      awaitingContinue: this.awaitingContinue,
      logLines: [...this.logLines],
      message: this.message,
    }
  }

  /** Visible hand for UI: human sees own; bots hidden unless revealBots. */
  visibleHand(player: PlayerId, revealBots = false): CardId[] {
    if (player === HUMAN || revealBots) {
      return sortHand(this.hands[player], this.contract)
    }
    return this.hands[player].map(() => 'XX' as unknown as CardId)
  }

  startHand(random: () => number = Math.random): PublicState {
    this.resetHand(random)
    this.autoPlayBids()
    return this.getState()
  }

  private resetHand(random: () => number = Math.random) {
    this.dealer = ((this.dealer + 1) % 4) as PlayerId
    const dealt = dealHands(random)
    for (const p of PLAYERS) {
      this.hands[p] = sortHand(dealt[p], null)
    }
    this.bids = {}
    this.highestBid = null
    this.highestBidder = null
    this.contract = null
    this.currentTrick = []
    this.finishedTricks = []
    this.result = null
    this.calledAcePlayed = false
    this.awaitingContinue = false
    this.passesInRow = 0
    this.phase = 'bidding'

    const forehand = ((this.dealer + 1) % 4) as PlayerId
    this.biddingOrder = [0, 1, 2, 3].map((i) => ((forehand + i) % 4) as PlayerId)
    this.biddingIndex = 0
    this.currentBidder = this.biddingOrder[0]
    this.whoseTurn = this.currentBidder
    this.trickLeader = forehand
    this.message = turnToBidMessage(this.currentBidder, this.highestBid)
    this.pushLog('Neue Karten gegeben.')
  }

  humanBid(bid: Bid): PublicState {
    if (this.phase !== 'bidding' || this.currentBidder !== HUMAN) {
      throw new Error('Jetzt kannst du nicht sagen.')
    }
    this.applyBid(HUMAN, bid)
    this.autoPlayBids()
    return this.getState()
  }

  acknowledgeTrick(): PublicState {
    if (!this.awaitingContinue) return this.getState()
    this.awaitingContinue = false
    this.currentTrick = []
    if (this.finishedTricks.length === 8) {
      this.finishGame()
      return this.getState()
    }
    this.whoseTurn = this.trickLeader
    this.message =
      this.trickLeader === 0 ? 'Du kommst raus.' : `${PLAYER_NAMES[this.trickLeader]} kommt raus.`
    return this.getState()
  }

  humanPlay(card: CardId): PublicState {
    if (this.phase !== 'playing' || this.whoseTurn !== HUMAN) {
      throw new Error('Du bist nicht am Zug.')
    }
    const legal = legalMoves(this.hands[HUMAN], this.contract!, this.currentTrick, this.calledAcePlayed)
    if (!legal.includes(card)) {
      throw new Error('Diese Karte darfst du nicht spielen.')
    }
    this.playCard(HUMAN, card)
    return this.getState()
  }

  legalForHuman(): CardId[] {
    if (this.awaitingContinue) return []
    if (this.phase !== 'playing' || this.whoseTurn !== HUMAN || !this.contract) return []
    return legalMoves(this.hands[HUMAN], this.contract, this.currentTrick, this.calledAcePlayed)
  }

  private applyBid(player: PlayerId, bid: Bid) {
    this.bids[player] = bid
    if (bid.kind === 'pass') {
      this.passesInRow += 1
      this.message = player === 0 ? 'Du sagst weiter.' : `${PLAYER_NAMES[player]} sagt weiter.`
    } else {
      this.passesInRow = 0
      this.highestBid = bid
      this.highestBidder = player
      const who = player === 0 ? 'Du' : PLAYER_NAMES[player]
      this.message = `${who}: ${formatBid(bid)}`
    }
    this.pushLog(this.message)

    const allPassed = PLAYERS.every((p) => this.bids[p]?.kind === 'pass')
    const everyoneActed = PLAYERS.every((p) => this.bids[p])
    const threePassesAfterBid = this.highestBid && this.passesInRow >= 3

    if (allPassed && everyoneActed) {
      this.message = 'Alle weiter — neu geben.'
      this.resetHand()
      return
    }

    if (threePassesAfterBid && this.highestBid && this.highestBidder !== null) {
      this.startPlaying(this.highestBidder, this.highestBid)
      return
    }

    this.biddingIndex += 1
    let guard = 0
    while (guard < 8) {
      const next = this.biddingOrder[this.biddingIndex % 4]
      this.biddingIndex += 1
      guard += 1
      if (this.bids[next]?.kind === 'pass' && this.highestBid) continue
      if (next === this.highestBidder && this.highestBid) continue
      this.currentBidder = next
      this.whoseTurn = next
      this.message = turnToBidMessage(next, this.highestBid)
      return
    }
    if (this.highestBid && this.highestBidder !== null) {
      this.startPlaying(this.highestBidder, this.highestBid)
    }
  }

  private startPlaying(caller: PlayerId, bid: Bid) {
    this.contract = resolveContract(bid, caller, this.hands)
    this.phase = 'playing'
    this.currentBidder = null
    const forehand = ((this.dealer + 1) % 4) as PlayerId
    this.trickLeader = forehand
    this.whoseTurn = forehand
    this.currentTrick = []
    this.finishedTricks = []
    this.calledAcePlayed = false
    this.awaitingContinue = false
    for (const p of PLAYERS) {
      this.hands[p] = sortHand(this.hands[p], this.contract)
    }
    this.message =
      forehand === 0
        ? `${formatContract(this.contract)} — Du kommst raus.`
        : `${formatContract(this.contract)} — ${PLAYER_NAMES[forehand]} kommt raus.`
    this.pushLog(formatContract(this.contract))
  }

  private playCard(player: PlayerId, card: CardId) {
    this.hands[player] = this.hands[player].filter((c) => c !== card)
    this.currentTrick.push({ player, card })
    this.message =
      player === 0 ? `Du spielst ${cardLabel(card)}.` : `${PLAYER_NAMES[player]} spielt ${cardLabel(card)}.`
    this.pushLog(this.message)

    if (this.contract?.kind === 'rufspiel' && card === this.contract.calledAce) {
      this.calledAcePlayed = true
    }

    if (this.currentTrick.length < 4) {
      const next = ((player + 1) % 4) as PlayerId
      this.whoseTurn = next
      return
    }

    const winner = trickWinner(this.currentTrick, this.contract!) as PlayerId
    const points = this.currentTrick.reduce((s, t) => s + cardPoints(t.card), 0)
    this.finishedTricks.push({
      cards: [...this.currentTrick],
      winner,
      points,
    })
    this.message =
      winner === 0 ? `Du stichst (${points} Augen).` : `${PLAYER_NAMES[winner]} sticht (${points} Augen).`
    this.pushLog(this.message)
    this.trickLeader = winner
    this.whoseTurn = null
    this.awaitingContinue = true
  }

  private finishGame() {
    this.phase = 'finished'
    this.whoseTurn = null
    this.result = scoreGame(this.contract!, this.finishedTricks)
    for (const { player, delta } of this.result.seatDeltas) {
      this.sessionScores[player] += delta
    }
    this.message = this.result.message
    this.pushLog(this.result.message)
  }

  private pushLog(line: string) {
    this.logLines = [...this.logLines, line].slice(-24)
  }

  /** Resolve bot bids quickly; card play is stepped from the UI with delay. */
  private autoPlayBids() {
    let guard = 0
    while (guard++ < 32) {
      if (this.phase === 'bidding' && this.currentBidder !== null && this.currentBidder !== HUMAN) {
        const bid = chooseBid(this.hands[this.currentBidder], this.highestBid)
        this.applyBid(this.currentBidder, bid)
        continue
      }
      break
    }
  }

  /** One bot card (or leftover bid). Returns false when human must act or idle/finished. */
  stepBot(): boolean {
    if (this.awaitingContinue) return false
    if (this.phase === 'bidding' && this.currentBidder !== null && this.currentBidder !== HUMAN) {
      const bid = chooseBid(this.hands[this.currentBidder], this.highestBid)
      this.applyBid(this.currentBidder, bid)
      return true
    }
    if (this.phase === 'playing' && this.whoseTurn !== null && this.whoseTurn !== HUMAN && this.contract) {
      const player = this.whoseTurn
      const card = chooseCard(
        this.hands[player],
        this.contract,
        this.currentTrick,
        player,
        this.calledAcePlayed,
      )
      this.playCard(player, card)
      return true
    }
    return false
  }

  needsBot(): boolean {
    if (this.awaitingContinue) return false
    if (this.phase === 'bidding' && this.currentBidder !== null && this.currentBidder !== HUMAN) return true
    if (this.phase === 'playing' && this.whoseTurn !== null && this.whoseTurn !== HUMAN) return true
    return false
  }
}

function turnToBidMessage(player: PlayerId, highest: Bid | null): string {
  const high = highest ? ` (liegt: ${formatBid(highest)})` : ''
  if (player === 0) return `Du bist dran mit dem Sagen${high}.`
  return `${PLAYER_NAMES[player]} ist dran mit dem Sagen${high}.`
}

function formatBid(bid: Bid): string {
  if (bid.kind === 'pass') return 'Weiter'
  if (bid.kind === 'wenz') return 'Wenz'
  if (bid.kind === 'solo') return `${SUIT_NAMES[bid.color]}-Solo`
  return `Rufspiel auf ${SUIT_NAMES[bid.color]}`
}

function formatContract(contract: Contract): string {
  if (contract.kind === 'wenz') return `Wenz von ${PLAYER_NAMES[contract.caller]}`
  if (contract.kind === 'solo') {
    return `${SUIT_NAMES[contract.color]}-Solo von ${PLAYER_NAMES[contract.caller]}`
  }
  return `Rufspiel ${SUIT_NAMES[contract.color]} von ${PLAYER_NAMES[contract.caller]} mit ${PLAYER_NAMES[contract.partner]}`
}

export { formatBid, formatContract }
