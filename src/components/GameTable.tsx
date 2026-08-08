import { CardView } from './CardView'
import type { Bid, CardId, PlayerId, PublicState } from '../game/types'
import { PLAYER_NAMES, SUIT_NAMES } from '../game/types'
import { callableColors, canAnnounce } from '../game/rules'
import { formatContract } from '../game/game'
import './GameTable.css'

interface Props {
  state: PublicState
  legal: CardId[]
  onBid: (bid: Bid) => void
  onPlay: (card: CardId) => void
  onNewHand: () => void
}

export function GameTable({ state, legal, onBid, onPlay, onNewHand }: Props) {
  const humanHand = state.hands[0]
  const isHumanBid = state.phase === 'bidding' && state.currentBidder === 0
  const isHumanPlay = state.phase === 'playing' && state.whoseTurn === 0

  return (
    <div className="table-shell">
      <header className="top-bar">
        <div className="brand">
          <p className="brand-mark">Schafkopf</p>
          <p className="brand-sub">Bayerisch · gegen drei Computer</p>
        </div>
        <div className="score-strip" aria-label="Punktestand">
          {[0, 1, 2, 3].map((p) => (
            <div key={p} className={`score-pill ${p === 0 ? 'you' : ''}`}>
              <span>{PLAYER_NAMES[p as PlayerId]}</span>
              <strong>{state.sessionScores[p] > 0 ? `+${state.sessionScores[p]}` : state.sessionScores[p]}</strong>
            </div>
          ))}
        </div>
      </header>

      <p className="status-line" role="status">
        {state.message}
        {state.contract ? ` · ${formatContract(state.contract)}` : ''}
      </p>

      <div className="felt">
        <div className="opponents-mobile" aria-label="Gegner">
          <Seat player={1} position="north" state={state} />
          <Seat player={2} position="north" state={state} />
          <Seat player={3} position="north" state={state} />
        </div>
        <div className="desktop-opponents">
          <Seat player={2} position="north" state={state} />
        </div>
        <div className="mid-row">
          <Seat player={1} position="west" state={state} />
          <div className="trick-area">
            {state.currentTrick.length === 0 && state.phase === 'playing' && (
              <p className="trick-hint">Stich</p>
            )}
            {state.currentTrick.map((t) => (
              <div key={`${t.player}-${t.card}`} className={`trick-card seat-${t.player}`}>
                <CardView card={t.card} compact disabled />
                <span>{PLAYER_NAMES[t.player]}</span>
              </div>
            ))}
            {state.phase === 'idle' && (
              <button type="button" className="primary-btn" onClick={onNewHand}>
                Neue Runde
              </button>
            )}
            {state.phase === 'finished' && state.result && (
              <div className="result-panel">
                <p>{state.result.message}</p>
                <p>
                  Augen: Spieler {state.result.playingPoints} · Gegenpartei {state.result.defendingPoints}
                </p>
                <button type="button" className="primary-btn" onClick={onNewHand}>
                  Nächste Runde
                </button>
              </div>
            )}
          </div>
          <Seat player={3} position="east" state={state} />
        </div>

        <div className="south">
          <div className="seat-meta">
            <strong>{PLAYER_NAMES[0]}</strong>
            {state.whoseTurn === 0 && <span className="turn-dot">am Zug</span>}
          </div>
          <div className="hand">
            {humanHand.map((card) => {
              const playable = isHumanPlay && legal.includes(card)
              return (
                <CardView
                  key={card}
                  card={card}
                  disabled={isHumanPlay && !playable}
                  onClick={playable ? () => onPlay(card) : undefined}
                />
              )
            })}
          </div>
        </div>
      </div>

      {isHumanBid && (
        <BiddingBar
          hand={humanHand}
          current={state.highestBid}
          onBid={onBid}
        />
      )}

      {state.phase === 'idle' && (
        <div className="start-overlay">
          <h1>Schafkopf</h1>
          <p>Du spielst gegen Sepp, Hias und Wastl. Rufspiel, Solo und Wenz.</p>
          <button type="button" className="primary-btn large" onClick={onNewHand}>
            Geben
          </button>
        </div>
      )}
    </div>
  )
}

function Seat({
  player,
  position,
  state,
}: {
  player: PlayerId
  position: 'north' | 'west' | 'east'
  state: PublicState
}) {
  const count = state.hands[player].length
  return (
    <div className={`seat ${position}`}>
      <div className="seat-meta">
        <strong>{PLAYER_NAMES[player]}</strong>
        {state.whoseTurn === player && <span className="turn-dot">am Zug</span>}
        {state.currentBidder === player && state.phase === 'bidding' && (
          <span className="turn-dot">sagt</span>
        )}
      </div>
      <div className={`bot-cards ${position}`}>
        {Array.from({ length: count }).map((_, i) => (
          <CardView key={i} card={'E7'} faceDown compact />
        ))}
      </div>
    </div>
  )
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
  const colors = callableColors(hand)
  const options: { label: string; bid: Bid }[] = [
    { label: 'Weiter', bid: { kind: 'pass' } },
    ...colors.map((color) => ({
      label: `Rufspiel ${SUIT_NAMES[color]}`,
      bid: { kind: 'rufspiel' as const, color },
    })),
    ...(['E', 'G', 'H', 'S'] as const).map((color) => ({
      label: `${SUIT_NAMES[color]}-Solo`,
      bid: { kind: 'solo' as const, color },
    })),
    { label: 'Wenz', bid: { kind: 'wenz' } },
  ]

  return (
    <div className="bidding-bar">
      <p>Was sagst du?</p>
      <div className="bid-actions">
        {options.map(({ label, bid }) => {
          const ok = canAnnounce(hand, bid, current)
          return (
            <button
              key={label}
              type="button"
              className={`bid-btn ${bid.kind === 'pass' ? 'pass' : ''}`}
              disabled={!ok}
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
