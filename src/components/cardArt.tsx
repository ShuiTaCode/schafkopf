import { useId, type ReactNode } from 'react'
import type { CardId, Rank, Suit } from '../game/types'
import { parseCard } from '../game/deck'

const SUIT_COLOR: Record<Suit, string> = {
  E: '#2b2418',
  G: '#1a6b34',
  H: '#b3182a',
  S: '#c89612',
}

const RANK_CORNER: Record<Rank, string> = {
  A: 'A',
  '10': '10',
  K: 'K',
  O: 'O',
  U: 'U',
  '9': '9',
  '8': '8',
  '7': '7',
}

export function SuitGlyph({ suit, className }: { suit: Suit; className?: string }) {
  const fill = SUIT_COLOR[suit]
  if (suit === 'E') {
    return (
      <g className={className} fill={fill}>
        <ellipse cx="50" cy="58" rx="22" ry="28" />
        <path d="M28 36c6-4 14-8 22-8s16 4 22 8c-8 6-14 8-22 8s-14-2-22-8z" />
        <rect x="46" y="12" width="8" height="18" rx="2" />
        <path d="M18 34h64" stroke={fill} strokeWidth="3" fill="none" />
      </g>
    )
  }
  if (suit === 'G') {
    return (
      <g className={className} fill={fill}>
        <path d="M50 12c18 16 28 38 28 58 0 18-12 30-28 30S22 88 22 70C22 50 32 28 50 12z" />
        <path d="M50 40c-10 14-12 28-6 40" fill="none" stroke="#0d3d1e" strokeWidth="3" />
        <path d="M50 88v10" stroke={fill} strokeWidth="5" strokeLinecap="round" />
      </g>
    )
  }
  if (suit === 'H') {
    return (
      <g className={className} fill={fill}>
        <path d="M50 92C18 64 8 46 22 28c9-12 22-8 28 4 6-12 19-16 28-4 14 18 4 36-28 64z" />
      </g>
    )
  }
  return (
    <g className={className} fill={fill}>
      <path d="M32 28c0-14 36-14 36 0v8c12 6 16 22 8 38-10 20-26 28-26 28s-16-8-26-28c-8-16-4-32 8-38z" />
      <ellipse cx="50" cy="24" rx="10" ry="8" />
      <circle cx="50" cy="78" r="6" />
    </g>
  )
}

function MiniSuit({ suit, x, y, s = 1 }: { suit: Suit; x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(-50 -50)`}>
      <SuitGlyph suit={suit} />
    </g>
  )
}

const PIP_LAYOUT: Record<string, Array<[number, number]>> = {
  '7': [
    [100, 78],
    [62, 118],
    [138, 118],
    [100, 168],
    [62, 218],
    [138, 218],
    [100, 268],
  ],
  '8': [
    [62, 78],
    [138, 78],
    [62, 128],
    [138, 128],
    [62, 218],
    [138, 218],
    [62, 268],
    [138, 268],
  ],
  '9': [
    [62, 78],
    [138, 78],
    [62, 128],
    [138, 128],
    [100, 168],
    [62, 218],
    [138, 218],
    [62, 268],
    [138, 268],
  ],
  '10': [
    [62, 72],
    [138, 72],
    [62, 118],
    [138, 118],
    [62, 164],
    [138, 164],
    [62, 218],
    [138, 218],
    [62, 268],
    [138, 268],
  ],
}

function Corner({ suit, rank, x, y, flip }: { suit: Suit; rank: Rank; x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' rotate(180)' : ''}`}>
      <text
        x="0"
        y="18"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontWeight="700"
        fontSize={rank === '10' ? 18 : 22}
        fill={SUIT_COLOR[suit]}
      >
        {RANK_CORNER[rank]}
      </text>
      <g transform="translate(0 36) scale(0.22) translate(-50 -50)">
        <SuitGlyph suit={suit} />
      </g>
    </g>
  )
}

function PictureFrame({ suit, title, children }: { suit: Suit; title: string; children: ReactNode }) {
  const color = SUIT_COLOR[suit]
  return (
    <g>
      <rect x="46" y="70" width="108" height="240" rx="8" fill="#f3e2b3" stroke={color} strokeWidth="3" />
      <rect x="52" y="76" width="96" height="228" rx="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.45" />
      {children}
      <text
        x="100"
        y="292"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontWeight="700"
        fontSize="13"
        fill={color}
        letterSpacing="0.12em"
      >
        {title}
      </text>
    </g>
  )
}

function FolkFigure({ suit, role }: { suit: Suit; role: 'K' | 'O' | 'U' }) {
  const color = SUIT_COLOR[suit]
  const hatY = role === 'K' ? 108 : 118
  return (
    <g>
      {role === 'K' && (
        <path d="M70 118 L78 98 L90 112 L100 92 L110 112 L122 98 L130 118 Z" fill="#d4a017" stroke="#7a5a10" />
      )}
      {role !== 'K' && (
        <path
          d={role === 'O' ? 'M68 128 Q100 96 132 128 L124 136 Q100 118 76 136 Z' : 'M74 132 Q100 112 126 132 L120 140 Q100 126 80 140 Z'}
          fill={color}
        />
      )}
      <circle cx="100" cy={hatY + 28} r="16" fill="#f0d2a8" stroke="#5a3a22" strokeWidth="1.4" />
      <path d="M88 150 q12 10 24 0" fill="none" stroke="#5a3a22" strokeWidth="1.4" />
      {role === 'O' && <rect x="86" y="148" width="28" height="4" rx="1" fill="#4a2c18" />}
      <path d="M78 168 Q100 158 122 168 L132 230 Q100 248 68 230 Z" fill={role === 'U' ? '#6b3e22' : '#3d5c3a'} />
      <g transform={`translate(100 ${role === 'U' ? 210 : 188}) scale(${role === 'O' ? 0.42 : 0.34}) translate(-50 -50)`}>
        <SuitGlyph suit={suit} />
      </g>
    </g>
  )
}

function CenterArt({ suit, rank }: { suit: Suit; rank: Rank }) {
  if (rank === 'A') {
    return (
      <PictureFrame suit={suit} title="SAU">
        <g transform="translate(100 168) scale(0.95) translate(-50 -50)">
          <SuitGlyph suit={suit} />
        </g>
      </PictureFrame>
    )
  }
  if (rank === 'K') {
    return (
      <PictureFrame suit={suit} title="KÖNIG">
        <FolkFigure suit={suit} role="K" />
      </PictureFrame>
    )
  }
  if (rank === 'O') {
    return (
      <PictureFrame suit={suit} title="OBER">
        <FolkFigure suit={suit} role="O" />
      </PictureFrame>
    )
  }
  if (rank === 'U') {
    return (
      <PictureFrame suit={suit} title="UNTER">
        <FolkFigure suit={suit} role="U" />
      </PictureFrame>
    )
  }
  const pips = PIP_LAYOUT[rank] ?? []
  return (
    <g>
      {pips.map(([x, y], i) => (
        <MiniSuit key={i} suit={suit} x={x} y={y} s={0.32} />
      ))}
    </g>
  )
}

export function CardFace({ card }: { card: CardId }) {
  const { suit, rank } = parseCard(card)
  const color = SUIT_COLOR[suit]
  return (
    <svg viewBox="0 0 200 380" className="card-face" aria-hidden>
      <defs>
        <linearGradient id={`paper-${card}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff8e6" />
          <stop offset="100%" stopColor="#ead7a8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="196" height="376" rx="14" fill={`url(#paper-${card})`} stroke="#5c4320" strokeWidth="3" />
      <rect x="10" y="10" width="180" height="360" rx="8" fill="none" stroke={color} strokeWidth="1.4" opacity="0.35" />
      <Corner suit={suit} rank={rank} x={28} y={22} />
      <Corner suit={suit} rank={rank} x={172} y={358} flip />
      <CenterArt suit={suit} rank={rank} />
    </svg>
  )
}

export function CardBack() {
  const rawId = useId().replace(/:/g, '')
  const patternId = `back-${rawId}`
  return (
    <svg viewBox="0 0 200 380" className="card-face" aria-hidden>
      <defs>
        <pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M9 1 L17 9 L9 17 L1 9 Z" fill="none" stroke="rgba(212,176,70,0.35)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="196" height="376" rx="14" fill="#14532d" stroke="#0b2e1a" strokeWidth="3" />
      <rect x="12" y="12" width="176" height="356" rx="8" fill={`url(#${patternId})`} stroke="#d4b046" strokeWidth="2" />
      <g transform="translate(100 190) scale(0.7) translate(-50 -50)" opacity="0.85">
        <SuitGlyph suit="E" />
      </g>
    </svg>
  )
}
