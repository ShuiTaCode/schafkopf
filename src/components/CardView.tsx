import type { CardId, Suit } from '../game/types'
import { parseCard } from '../game/deck'
import { RANK_NAMES, SUIT_NAMES } from '../game/types'
import './CardView.css'

const SUIT_SYMBOL: Record<Suit, string> = {
  E: '♠', // stylized; Bavarian suits via color + label
  G: '♣',
  H: '♥',
  S: '♦',
}

const SUIT_CLASS: Record<Suit, string> = {
  E: 'suit-eichel',
  G: 'suit-gras',
  H: 'suit-herz',
  S: 'suit-schell',
}

interface Props {
  card: CardId
  selected?: boolean
  disabled?: boolean
  faceDown?: boolean
  onClick?: () => void
  compact?: boolean
}

export function CardView({ card, selected, disabled, faceDown, onClick, compact }: Props) {
  if (faceDown) {
    return <div className={`sk-card back ${compact ? 'compact' : ''}`} aria-hidden />
  }

  const { suit, rank } = parseCard(card)
  const label = `${SUIT_NAMES[suit]} ${RANK_NAMES[rank]}`

  return (
    <button
      type="button"
      className={`sk-card ${SUIT_CLASS[suit]} ${selected ? 'selected' : ''} ${compact ? 'compact' : ''} ${disabled ? 'is-disabled' : ''} ${onClick ? 'is-interactive' : ''}`}
      disabled={Boolean(onClick) && disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <span className="rank">{rank === 'A' ? 'A' : rank}</span>
      <span className="suit-sym">{SUIT_SYMBOL[suit]}</span>
      <span className="suit-name">{SUIT_NAMES[suit]}</span>
    </button>
  )
}
