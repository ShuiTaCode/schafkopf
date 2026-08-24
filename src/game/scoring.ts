import { cardPoints } from './deck'
import { playingTeam } from './rules'
import type { Contract, FinishedTrick, GameResult, PlayerId, SeatScore } from './types'
import { PLAYERS, PLAYER_NAMES, SUIT_NAMES } from './types'

function baseValue(contract: Contract): number {
  if (contract.kind === 'rufspiel') return 1
  return 2 // solo / wenz
}

export function runningAugen(
  contract: Contract,
  tricks: FinishedTrick[],
): { playing: number; defending: number } {
  const playing = playingTeam(contract)
  let playingPoints = 0
  let defendingPoints = 0
  for (const trick of tricks) {
    if (playing.includes(trick.winner)) playingPoints += trick.points
    else defendingPoints += trick.points
  }
  return { playing: playingPoints, defending: defendingPoints }
}

export function scoreGame(
  contract: Contract,
  tricks: FinishedTrick[],
  names: Record<PlayerId, string> = PLAYER_NAMES,
): GameResult {
  const playing = playingTeam(contract) as PlayerId[]
  const defending = PLAYERS.filter((p) => !playing.includes(p))

  const pointsByPlayer: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  const tricksByPlayer: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }

  for (const trick of tricks) {
    const pts = trick.cards.reduce((sum, c) => sum + cardPoints(c.card), 0)
    pointsByPlayer[trick.winner] += pts
    tricksByPlayer[trick.winner] += 1
  }

  const playingPoints = playing.reduce((s: number, p) => s + pointsByPlayer[p], 0)
  const defendingPoints = 120 - playingPoints
  const playingWon = playingPoints >= 61

  const defendingTricks = defending.reduce((s: number, p) => s + tricksByPlayer[p], 0)
  const playingTricks = playing.reduce((s: number, p) => s + tricksByPlayer[p], 0)

  // Schneider: losers have < 31 points
  const loserPoints = playingWon ? defendingPoints : playingPoints
  const schneider = loserPoints < 31
  // Schwarz: losers took no tricks
  const schwarz = (playingWon ? defendingTricks : playingTricks) === 0

  let units = baseValue(contract)
  if (schneider) units += 1
  if (schwarz) units += 1

  const seatDeltas: SeatScore[] = PLAYERS.map((player) => {
    let delta = 0
    if (contract.kind === 'rufspiel') {
      const onPlaying = playing.includes(player)
      const sideWon = onPlaying === playingWon
      delta = sideWon ? units : -units
    } else if (player === contract.caller) {
      delta = playingWon ? units * 3 : -units * 3
    } else {
      delta = playingWon ? -units : units
    }
    return { player, delta }
  })

  const contractLabel =
    contract.kind === 'rufspiel'
      ? `Rufspiel auf ${SUIT_NAMES[contract.color]}`
      : contract.kind === 'solo'
        ? `${SUIT_NAMES[contract.color]}-Solo`
        : 'Wenz'

  const outcome = playingWon ? 'gewonnen' : 'verloren'
  const extras = [schneider ? 'Schneider' : null, schwarz ? 'Schwarz' : null].filter(Boolean).join(', ')
  const teamNames = playing.map((p) => (p === 0 ? 'Du' : names[p])).join(' & ')
  const message = `${contractLabel}: ${teamNames} ${outcome} mit ${playingPoints} Augen${extras ? ` (${extras})` : ''}.`

  return {
    contract,
    playingTeam: playing,
    defendingTeam: defending,
    playingPoints,
    defendingPoints,
    playingWon,
    schneider,
    schwarz,
    seatDeltas,
    message,
  }
}
