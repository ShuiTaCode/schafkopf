import { describe, expect, it } from 'vitest'
import { createDeck, cardPoints } from './deck'
import { SchafkopfGame } from './game'
import { beats, isTrump, sortHand, trickWinner, trumpOrder } from './ordering'
import { bidRank, canCallColor, legalMoves, callableColors } from './rules'
import { runningAugen, scoreGame } from './scoring'
import type { Contract, FinishedTrick } from './types'

describe('deck', () => {
  it('has 32 cards and 120 points', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(32)
    expect(deck.reduce((s, c) => s + cardPoints(c), 0)).toBe(120)
  })
})

describe('ordering', () => {
  const ruf: Contract = {
    kind: 'rufspiel',
    color: 'E',
    caller: 0,
    partner: 1,
    calledAce: 'EA',
  }

  it('ranks Eichel-Ober highest in Rufspiel', () => {
    expect(trumpOrder(ruf)[0]).toBe('EO')
    expect(isTrump('H7', ruf)).toBe(true)
    expect(isTrump('E9', ruf)).toBe(false)
  })

  it('lets trump beat color', () => {
    expect(beats('EA', 'H7', ruf)).toBe(true)
    expect(beats('H7', 'EA', ruf)).toBe(false)
  })

  it('resolves trick winner', () => {
    const winner = trickWinner(
      [
        { player: 0, card: 'GA' },
        { player: 1, card: 'G10' },
        { player: 2, card: 'H7' },
        { player: 3, card: 'G9' },
      ],
      ruf,
    )
    expect(winner).toBe(2)
  })

  it('orders Wenz unters only as trump', () => {
    const wenz: Contract = { kind: 'wenz', caller: 0 }
    expect(isTrump('EU', wenz)).toBe(true)
    expect(isTrump('EO', wenz)).toBe(false)
    expect(beats('EA', 'EO', wenz)).toBe(false) // same color, EO lower than A in wenz color order? A is highest
    expect(beats('EO', 'EA', wenz)).toBe(true)
  })
})

describe('rules', () => {
  const ruf: Contract = {
    kind: 'rufspiel',
    color: 'E',
    caller: 0,
    partner: 1,
    calledAce: 'EA',
  }

  it('allows calling only without the ace and with plain color', () => {
    expect(canCallColor(['E9', 'E8', 'GA'], 'E')).toBe(true)
    expect(canCallColor(['EA', 'E9'], 'E')).toBe(false)
    expect(canCallColor(['EO', 'EU'], 'E')).toBe(false)
    expect(callableColors(['E9', 'GA', 'S8'])).toEqual(['E', 'S'])
  })

  it('enforces follow suit', () => {
    const hand = ['GA', 'G9', 'H7', 'S8'] as const
    const legal = legalMoves([...hand], ruf, [{ card: 'G10' }], true)
    expect(legal.sort()).toEqual(['GA', 'G9'].sort())
  })

  it('forces called ace when call color is led', () => {
    const hand = ['EA', 'E9', 'GA'] as const
    const legal = legalMoves([...hand], ruf, [{ card: 'E10' }], false)
    expect(legal).toEqual(['EA'])
  })
})

describe('scoring', () => {
  it('awards win at 61+', () => {
    const contract: Contract = { kind: 'solo', color: 'H', caller: 0 }
    const many: FinishedTrick[] = []
    many.push({
      cards: [
        { player: 0, card: 'EA' },
        { player: 1, card: 'E10' },
        { player: 2, card: 'EK' },
        { player: 3, card: 'E9' },
      ],
      winner: 0,
      points: 25,
    })
    many.push({
      cards: [
        { player: 0, card: 'GA' },
        { player: 1, card: 'G10' },
        { player: 2, card: 'GK' },
        { player: 3, card: 'G9' },
      ],
      winner: 0,
      points: 25,
    })
    many.push({
      cards: [
        { player: 0, card: 'SA' },
        { player: 1, card: 'S10' },
        { player: 2, card: 'SK' },
        { player: 3, card: 'S9' },
      ],
      winner: 0,
      points: 25,
    })
    // remaining low points to others
    many.push({
      cards: [
        { player: 1, card: 'HO' },
        { player: 2, card: 'HU' },
        { player: 3, card: 'H8' },
        { player: 0, card: 'H7' },
      ],
      winner: 1,
      points: 5,
    })

    const result = scoreGame(contract, many)
    expect(result.playingPoints).toBe(75)
    expect(result.playingWon).toBe(true)
    expect(result.seatDeltas[0].delta).toBeGreaterThan(0)
    expect(result.seatDeltas[1].delta).toBeLessThan(0)
  })

  it('pays defenders when solo caller loses', () => {
    const contract: Contract = { kind: 'solo', color: 'H', caller: 0 }
    const tricks: FinishedTrick[] = [
      {
        cards: [
          { player: 1, card: 'EA' },
          { player: 2, card: 'E10' },
          { player: 3, card: 'EK' },
          { player: 0, card: 'E9' },
        ],
        winner: 1,
        points: 25,
      },
      {
        cards: [
          { player: 1, card: 'GA' },
          { player: 2, card: 'G10' },
          { player: 3, card: 'GK' },
          { player: 0, card: 'G9' },
        ],
        winner: 1,
        points: 25,
      },
      {
        cards: [
          { player: 1, card: 'SA' },
          { player: 2, card: 'S10' },
          { player: 3, card: 'SK' },
          { player: 0, card: 'S9' },
        ],
        winner: 1,
        points: 25,
      },
    ]
    const result = scoreGame(contract, tricks)
    expect(result.playingWon).toBe(false)
    expect(result.seatDeltas[0].delta).toBeLessThan(0)
    expect(result.seatDeltas[1].delta).toBeGreaterThan(0)
    expect(result.seatDeltas[2].delta).toBeGreaterThan(0)
    expect(result.seatDeltas[3].delta).toBeGreaterThan(0)
  })

  it('counts running Augen during the hand', () => {
    const contract: Contract = { kind: 'solo', color: 'H', caller: 0 }
    const tricks: FinishedTrick[] = [
      {
        cards: [
          { player: 0, card: 'HA' },
          { player: 1, card: 'H10' },
          { player: 2, card: 'HK' },
          { player: 3, card: 'H9' },
        ],
        winner: 0,
        points: 25,
      },
      {
        cards: [
          { player: 1, card: 'EA' },
          { player: 2, card: 'E10' },
          { player: 3, card: 'EK' },
          { player: 0, card: 'E9' },
        ],
        winner: 1,
        points: 25,
      },
    ]
    expect(runningAugen(contract, tricks)).toEqual({ playing: 25, defending: 25 })
  })
})

describe('bidding rank', () => {
  it('orders Rufspiel < Wenz < Solo', () => {
    expect(bidRank({ kind: 'rufspiel', color: 'E' })).toBeLessThan(bidRank({ kind: 'wenz' }))
    expect(bidRank({ kind: 'wenz' })).toBeLessThan(bidRank({ kind: 'solo', color: 'H' }))
  })
})

describe('bidding order', () => {
  it('lets every player before the human speak on the first deal', () => {
    const game = new SchafkopfGame()
    game.startHand(() => 0.42)
    const forehand = ((game.dealer + 1) % 4) as 0 | 1 | 2 | 3
    let seat = forehand
    while (seat !== 0) {
      expect(game.bids[seat], `${seat} sollte schon gesagt haben`).toBeDefined()
      seat = ((seat + 1) % 4) as 0 | 1 | 2 | 3
    }
  })

  it('redeals when everyone says weiter', () => {
    let found = false
    for (let seed = 0; seed < 5000; seed++) {
      const game = new SchafkopfGame()
      game.startHand(mulberry32(seed))
      if (game.phase !== 'bidding' || game.currentBidder !== 0) continue
      if (![1, 2, 3].every((p) => game.bids[p as 1 | 2 | 3]?.kind === 'pass')) continue
      const dealerBefore = game.dealer
      game.humanBid({ kind: 'pass' })
      expect(game.dealer).not.toBe(dealerBefore)
      found = true
      break
    }
    expect(found).toBe(true)
  })

  it('plays many hands without getting stuck in bidding', () => {
    const game = new SchafkopfGame()
    const random = mulberry32(20260824)
    let finishedHands = 0
    let actions = 0
    game.startHand(random)
    while (finishedHands < 40 && actions < 8000) {
      actions += 1
      if (game.awaitingContinue) {
        game.acknowledgeTrick()
        continue
      }
      if (game.phase === 'finished') {
        finishedHands += 1
        game.startHand(random)
        continue
      }
      if (game.phase === 'bidding' && game.currentBidder === 0) {
        game.humanBid({ kind: 'pass' })
        continue
      }
      if (game.needsBot()) {
        expect(game.stepBot(), `Bot-Schritt hängt (Aktion ${actions})`).toBe(true)
        continue
      }
      if (game.phase === 'playing' && game.whoseTurn === 0) {
        const legal = game.legalForHuman()
        expect(legal.length).toBeGreaterThan(0)
        game.humanPlay(legal[0])
        continue
      }
      throw new Error(`Spiel hängt: phase=${game.phase} bidder=${game.currentBidder} turn=${game.whoseTurn}`)
    }
    expect(finishedHands).toBe(40)
  })
})

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('hand sort', () => {
  it('groups trumps first even before a contract', () => {
    const sorted = sortHand(['EA', 'G7', 'H8', 'SU', 'EO'], null)
    expect(sorted.slice(0, 3)).toEqual(['EO', 'SU', 'H8'])
  })
})

describe('trick continue', () => {
  it('keeps the completed trick until acknowledged', () => {
    const game = new SchafkopfGame()
    game.phase = 'playing'
    game.contract = {
      kind: 'rufspiel',
      color: 'E',
      caller: 0,
      partner: 1,
      calledAce: 'EA',
    }
    game.calledAcePlayed = true
    game.hands = { 0: ['H7'], 1: [], 2: [], 3: [] }
    game.currentTrick = [
      { player: 1, card: 'H8' },
      { player: 2, card: 'H9' },
      { player: 3, card: 'HK' },
    ]
    game.whoseTurn = 0
    game.humanPlay('H7')
    expect(game.awaitingContinue).toBe(true)
    expect(game.currentTrick).toHaveLength(4)
    expect(game.whoseTurn).toBeNull()
    expect(game.getState().awaitingContinue).toBe(true)
    expect(game.getState().message).toMatch(/stichst|sticht/)
    game.acknowledgeTrick()
    expect(game.awaitingContinue).toBe(false)
    expect(game.currentTrick).toHaveLength(0)
    expect(game.whoseTurn).toBe(game.trickLeader)
  })
})
