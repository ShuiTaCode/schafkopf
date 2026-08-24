import type { PlayerId } from '../game/types'

export type Gender = 'm' | 'f'

/** Prozent der Szene (0–100): Mundmitte, Bubble sitzt darüber. */
export interface MouthAnchor {
  x: number
  y: number
}

export interface SceneSeat {
  gender: Gender
  name: string
  mouth: MouthAnchor
}

export interface SceneDef {
  id: string
  src: string
  /** Links / mitte / rechts = Sitze 1 / 2 / 3. */
  seats: {
    1: SceneSeat
    2: SceneSeat
    3: SceneSeat
  }
}

/**
 * Foto-Analyse: Geschlecht + Mund-Anker (x/y in % der Bildfläche).
 * Kalibriert für Landscape-Cover (Handy quer).
 */
export const SCENES: SceneDef[] = [
  {
    id: 'scene_1',
    src: '/theme/scene_1.png',
    seats: {
      1: { gender: 'm', name: 'Sepp', mouth: { x: 23, y: 38 } },
      2: { gender: 'f', name: 'Resi', mouth: { x: 49, y: 39 } },
      3: { gender: 'm', name: 'Wastl', mouth: { x: 77, y: 38 } },
    },
  },
  {
    id: 'scene_2',
    src: '/theme/scene_2.png',
    seats: {
      1: { gender: 'm', name: 'Franz', mouth: { x: 22, y: 38 } },
      2: { gender: 'f', name: 'Gretl', mouth: { x: 50, y: 37 } },
      3: { gender: 'm', name: 'Toni', mouth: { x: 78, y: 38 } },
    },
  },
  {
    id: 'scene_3',
    src: '/theme/scene_3.png',
    seats: {
      1: { gender: 'f', name: 'Vroni', mouth: { x: 21, y: 36 } },
      2: { gender: 'm', name: 'Hias', mouth: { x: 50, y: 35 } },
      3: { gender: 'f', name: 'Anni', mouth: { x: 78, y: 36 } },
    },
  },
  {
    id: 'scene_4',
    src: '/theme/scene_4.png',
    seats: {
      1: { gender: 'm', name: 'Michl', mouth: { x: 22, y: 37 } },
      2: { gender: 'f', name: 'Leni', mouth: { x: 50, y: 36 } },
      3: { gender: 'm', name: 'Xaver', mouth: { x: 76, y: 37 } },
    },
  },
  {
    id: 'scene_5',
    src: '/theme/scene_5.png',
    seats: {
      1: { gender: 'f', name: 'Kathi', mouth: { x: 22, y: 36 } },
      2: { gender: 'm', name: 'Ludwig', mouth: { x: 47, y: 35 } },
      3: { gender: 'm', name: 'Wastl', mouth: { x: 74, y: 36 } },
    },
  },
]

export function namesFromScene(scene: SceneDef): Record<PlayerId, string> {
  return {
    0: 'Du',
    1: scene.seats[1].name,
    2: scene.seats[2].name,
    3: scene.seats[3].name,
  }
}

export function pickScene(excludeId?: string): SceneDef {
  const pool = excludeId ? SCENES.filter((s) => s.id !== excludeId) : SCENES
  const list = pool.length > 0 ? pool : SCENES
  return list[Math.floor(Math.random() * list.length)]
}

export function opponentLabel(scene: SceneDef): string {
  const { 1: a, 2: b, 3: c } = scene.seats
  return `${a.name}, ${b.name} und ${c.name}`
}
