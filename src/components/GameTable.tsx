import { CardView } from './CardView'
import type { Bid, CardId, Contract, PlayerId, PublicState } from '../game/types'
import { SUIT_NAMES } from '../game/types'
import { canAnnounce, playingTeam, rufspielBlockReason } from '../game/rules'
import { effectiveColor } from '../game/ordering'
import { formatBid, formatContract } from '../game/game'
import { runningAugen } from '../game/scoring'
import { opponentLabel, type SceneDef } from '../theme/scenes'
import './GameTable.css'

interface Props {
  state: PublicState
  scene: SceneDef
  legal: CardId[]
  onBid: (bid: Bid) => void
  onPlay: (card: CardId) => void
  onNewHand: () => void
  onContinue: () => void
}

const SEAT_POS: Record<PlayerId, 'south' | 'west' | 'north' | 'east'> = {
  0: 'south',
  1: 'west',
  2: 'north',
  3: 'east',
}

const OPPONENTS = [1, 2, 3] as const

export function GameTable({ state, scene, legal, onBid, onPlay, onNewHand, onContinue }: Props) {
  const names = state.playerNames
  const humanHand = state.hands[0]
  const isHumanBid = state.phase === 'bidding' && state.currentBidder === 0
  const isHumanPlay = state.phase === 'playing' && state.whoseTurn === 0 && !state.awaitingContinue
  const augen = state.contract ? runningAugen(state.contract, state.finishedTricks) : null
  const team = state.contract ? playingTeam(state.contract) : []
  const hint = playHint(state, legal, isHumanPlay)

  return (
    <>
      <div className="landscape-gate" role="dialog" aria-label="Querformat nötig">
        <p className="landscape-gate-title">Schafkopf</p>
        <p>Bitte das Handy quer halten.</p>
      </div>

      <div className="room">
        <header className="hud">
          <div className="brand-block">
            <p className="brand-mark">Schafkopf</p>
            {state.phase === 'idle' ? (
              <p className="brand-sub">Bayerisch · quer halten</p>
            ) : (
              <p className="brand-sub">gegen {opponentLabel(scene)}</p>
            )}
          </div>
          {state.contract && (
            <p className="contract-banner">{formatContract(state.contract, names)}</p>
          )}
          {augen && state.phase !== 'idle' && (
            <div className="augen-meter" aria-label="Augen im laufenden Spiel">
              <span>
                Spieler <strong>{augen.playing}</strong>
              </span>
              <span className="augen-sep">:</span>
              <span>
                Gegner <strong>{augen.defending}</strong>
              </span>
            </div>
          )}
        </header>

        <p className="status-line" role="status">
          {state.message}
        </p>

        <div className="scene-stage">
          <div className="scene-fit">
            <img className="scene-photo" src={scene.src} alt="" draggable={false} />
            {OPPONENTS.map((player) => (
              <OpponentHud
                key={player}
                player={player}
                seat={scene.seats[player]}
                state={state}
                team={team}
                names={names}
              />
            ))}

            <div className="trick-area">
              {state.phase === 'playing' &&
                state.currentTrick.length === 0 &&
                !state.awaitingContinue && <p className="trick-hint">Stich</p>}
              {([2, 1, 3, 0] as PlayerId[]).map((player) => {
                const played = state.currentTrick.find((t) => t.player === player)
                const winner =
                  state.awaitingContinue && state.finishedTricks.at(-1)?.winner === player
                return (
                  <div
                    key={player}
                    className={`trick-slot ${SEAT_POS[player]} ${played ? 'filled' : ''} ${winner ? 'winner' : ''}`}
                  >
                    {played ? (
                      <>
                        <CardView card={played.card} compact disabled />
                        <span>{names[player]}</span>
                      </>
                    ) : (
                      <span className="empty-slot">{names[player]}</span>
                    )}
                  </div>
                )
              })}

              {state.phase === 'finished' && state.result && (
                <div className="result-panel">
                  <p>{state.result.message}</p>
                  <p>
                    Augen: Spieler {state.result.playingPoints} · Gegenpartei{' '}
                    {state.result.defendingPoints}
                  </p>
                  <button type="button" className="primary-btn" onClick={onNewHand}>
                    Nächste Runde
                  </button>
                </div>
              )}
            </div>
          </div>

          {state.awaitingContinue && (
            <button type="button" className="primary-btn continue-btn" onClick={onContinue}>
              Weiter
            </button>
          )}

          <div className="south">
            <SeatBadge player={0} state={state} team={team} names={names} />
            {hint && <p className="play-hint">{hint}</p>}
            <div className="hand">
              {humanHand.map((card, i) => {
                const playable = isHumanPlay && legal.includes(card)
                const fan = fanDeg(i, humanHand.length)
                return (
                  <CardView
                    key={card}
                    card={card}
                    fanDeg={fan}
                    disabled={isHumanPlay && !playable}
                    onClick={playable ? () => onPlay(card) : undefined}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {isHumanBid && (
          <BiddingBar hand={humanHand} current={state.highestBid} onBid={onBid} />
        )}

        {state.phase === 'idle' && (
          <div className="start-overlay">
            <h1>Schafkopf</h1>
            <p>
              Du spielst gegen {opponentLabel(scene)}. Rufspiel, Wenz und Solo — bayerisches Blatt.
              Handy bitte quer halten.
            </p>
            <button type="button" className="primary-btn large" onClick={onNewHand}>
              Geben
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function OpponentHud({
  player,
  seat,
  state,
  team,
  names,
}: {
  player: PlayerId
  seat: SceneDef['seats'][1]
  state: PublicState
  team: number[]
  names: Record<PlayerId, string>
}) {
  const bubble = speechFor(player, state)
  const nameTop = Math.max(4, seat.mouth.y - 10)
  return (
    <>
      <div
        className="name-pin"
        style={{ left: `${seat.mouth.x}%`, top: `${nameTop}%` }}
      >
        <SeatBadge player={player} state={state} team={team} names={names} />
      </div>
      {bubble && (
        <div
          className="bubble-pin"
          style={{ left: `${seat.mouth.x}%`, top: `${seat.mouth.y}%` }}
        >
          <div className="speech-bubble" aria-live="polite">
            {bubble}
            <span className="speech-bubble-tail" aria-hidden="true" />
          </div>
        </div>
      )}
    </>
  )
}

function speechFor(player: PlayerId, state: PublicState): string | null {
  if (state.phase === 'bidding') {
    const bid = state.bids[player]
    if (bid) return formatBid(bid) === 'Weiter' ? 'Weiter!' : formatBid(bid)
    if (state.currentBidder === player) return '…'
    return null
  }
  if (state.phase === 'playing' && state.whoseTurn === player && state.currentTrick.length === 0) {
    return 'raus'
  }
  return null
}

function fanDeg(index: number, total: number): number {
  if (total <= 1) return 0
  const spread = Math.min(22, total * 2.6)
  const t = index / (total - 1)
  return -spread / 2 + t * spread
}

function playHint(state: PublicState, legal: CardId[], isHumanPlay: boolean): string | null {
  if (!isHumanPlay || !state.contract) return null
  if (state.currentTrick.length === 0) return 'Du kommst raus — freie Wahl.'
  const lead = state.currentTrick[0].card
  const color = effectiveColor(lead, state.contract)
  const mustFollow =
    legal.length > 0 && legal.every((c) => effectiveColor(c, state.contract!) === color)
  if (color === 'TRUMP' && mustFollow) return 'Trumpf ist angespielt — Trumpf zugeben.'
  if (mustFollow && color !== 'TRUMP') {
    return `${SUIT_NAMES[color]} ist angespielt — Farbe bekennen.`
  }
  return 'Keine Farbe — stechen oder abwerfen.'
}

function SeatBadge({
  player,
  state,
  team,
  names,
}: {
  player: PlayerId
  state: PublicState
  team: number[]
  names: Record<PlayerId, string>
}) {
  const score = state.sessionScores[player]
  const isCaller = state.contract?.caller === player
  const isPartner = state.contract?.kind === 'rufspiel' && state.contract.partner === player
  const onTeam = team.includes(player)
  return (
    <div
      className={`seat-badge ${player === 0 ? 'you' : ''} ${onTeam ? 'team' : ''} ${isCaller ? 'caller' : ''}`}
    >
      <div>
        <strong>{names[player]}</strong>
        <span className="pts">{score > 0 ? `+${score}` : score} P</span>
      </div>
      {state.whoseTurn === player && <span className="turn-dot">am Zug</span>}
      {state.currentBidder === player && state.phase === 'bidding' && (
        <span className="turn-dot">sagt</span>
      )}
      {isCaller && state.contract && <span className="role-pill">{contractShort(state.contract)}</span>}
      {isPartner && <span className="role-pill partner">Mitspieler</span>}
    </div>
  )
}

function contractShort(contract: Contract): string {
  if (contract.kind === 'wenz') return 'Wenz'
  if (contract.kind === 'solo') return `${SUIT_NAMES[contract.color]}-Solo`
  return `Rufspiel ${SUIT_NAMES[contract.color]}`
}

function BiddingBar({
  hand,
  current,
  onBid,
}: {
  hand: CardId[]
  current: Bid | null
  onBid: (bid: Bid) => void
}) {
  const rufColors = ['E', 'G', 'S'] as const
  const options: { label: string; bid: Bid }[] = [
    { label: 'Weiter', bid: { kind: 'pass' } },
    ...rufColors.map((color) => ({
      label: `Rufspiel ${SUIT_NAMES[color]}`,
      bid: { kind: 'rufspiel' as const, color },
    })),
    { label: 'Wenz', bid: { kind: 'wenz' } },
    ...(['E', 'G', 'H', 'S'] as const).map((color) => ({
      label: `${SUIT_NAMES[color]}-Solo`,
      bid: { kind: 'solo' as const, color },
    })),
  ]

  return (
    <div className="bidding-bar">
      <p>Was sagst du?</p>
      <div className="bid-actions">
        {options.map(({ label, bid }) => {
          const ok = canAnnounce(hand, bid, current)
          const reason = !ok
            ? bid.kind === 'rufspiel'
              ? (rufspielBlockReason(hand, bid.color) ?? 'Ein höheres Spiel liegt schon.')
              : bid.kind === 'pass'
                ? undefined
                : 'Ein höheres Spiel liegt schon.'
            : undefined
          return (
            <button
              key={label}
              type="button"
              className={`bid-btn ${bid.kind === 'pass' ? 'pass' : ''}`}
              disabled={!ok}
              title={reason}
              onClick={() => onBid(bid)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
