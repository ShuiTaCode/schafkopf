import { describe, expect, it } from 'vitest'
import { createDeck, cardPoints } from './deck'
import { beats, isTrump, trickWinner, trumpOrder } from './ordering'
import { canCallColor, legalMoves, callableColors } from './rules'
import { scoreGame } from './scoring'
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
})
