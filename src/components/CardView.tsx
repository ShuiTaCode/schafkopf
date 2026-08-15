import type { CSSProperties } from 'react'
import type { CardId } from '../game/types'
import { parseCard } from '../game/deck'
import { RANK_NAMES, SUIT_NAMES } from '../game/types'
import { CardBack } from './cardArt'
import { CARD_SPRITES, DECK_SHEET } from './deckSheet'
import './CardView.css'

interface Props {
  card: CardId
  selected?: boolean
  disabled?: boolean
  faceDown?: boolean
  onClick?: () => void
  compact?: boolean
  fanDeg?: number
}

export function CardView({
  card,
  selected,
  disabled,
  faceDown,
  onClick,
  compact,
  fanDeg = 0,
}: Props) {
  const { suit, rank } = parseCard(card)
  const label = faceDown ? 'Karte verdeckt' : `${SUIT_NAMES[suit]} ${RANK_NAMES[rank]}`
  const interactive = Boolean(onClick) && !disabled
  const sprite = CARD_SPRITES[card]

  const style = {
    '--fan': `${fanDeg}deg`,
    '--sx': sprite.x,
    '--sy': sprite.y,
    '--cw': sprite.w,
    '--ch': sprite.h,
    '--sw': DECK_SHEET.width,
    '--sh': DECK_SHEET.height,
  } as CSSProperties

  return (
    <button
      type="button"
      className={`sk-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''} ${disabled ? 'is-disabled' : ''} ${interactive ? 'is-interactive' : ''} ${faceDown ? 'is-back' : 'is-face'}`}
      style={style}
      disabled={Boolean(onClick) && disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {faceDown ? <CardBack /> : <span className="sk-card-face" />}
    </button>
  )
}
