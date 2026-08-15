import type { CardId, Rank, Suit } from '../game/types'

/** public/deck.webp — 4 rows × 8 cols, measured from the green felt. */
export const DECK_SHEET = {
  width: 4440,
  height: 2776,
} as const

const SUIT_ROW: Suit[] = ['E', 'G', 'H', 'S']
const RANK_COL: Rank[] = ['A', '10', 'K', 'O', 'U', '9', '8', '7']

const COLS: Array<[x: number, w: number]> = [
  [610, 372],
  [1019, 372],
  [1425, 372],
  [1834, 372],
  [2241, 371],
  [2650, 371],
  [3052, 374],
  [3461, 372],
]

const ROWS: Array<[y: number, h: number]> = [
  [67, 647],
  [733, 654],
  [1399, 647],
  [2065, 648],
]

const INSET = 2

export interface CardSprite {
  x: number
  y: number
  w: number
  h: number
}

export const CARD_SPRITES: Record<CardId, CardSprite> = (() => {
  const map = {} as Record<CardId, CardSprite>
  for (let r = 0; r < SUIT_ROW.length; r++) {
    for (let c = 0; c < RANK_COL.length; c++) {
      const [x, w] = COLS[c]
      const [y, h] = ROWS[r]
      const id = `${SUIT_ROW[r]}${RANK_COL[c]}` as CardId
      map[id] = {
        x: x + INSET,
        y: y + INSET,
        w: w - INSET * 2,
        h: h - INSET * 2,
      }
    }
  }
  return map
})()
