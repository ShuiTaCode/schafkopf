import { useEffect, useMemo, useRef, useState } from 'react'
import { SchafkopfGame } from './game/game'
import type { Bid, CardId, PublicState } from './game/types'
import { GameTable } from './components/GameTable'
import { namesFromScene, pickScene, type SceneDef } from './theme/scenes'
import { enableImmersivePwa } from './pwa'

const BOT_DELAY_MS = 620

function useGame() {
  const gameRef = useRef(new SchafkopfGame())
  const sceneRef = useRef<SceneDef>(pickScene())
  const [state, setState] = useState<PublicState>(() => {
    gameRef.current.setPlayerNames(namesFromScene(sceneRef.current))
    return gameRef.current.getState()
  })
  const [scene, setScene] = useState<SceneDef>(() => sceneRef.current)
  const [botNonce, setBotNonce] = useState(0)

  const sync = () => {
    setState(gameRef.current.getState())
    setBotNonce((n) => n + 1)
  }

  useEffect(() => {
    if (!gameRef.current.needsBot()) return
    const id = window.setTimeout(() => {
      if (gameRef.current.stepBot()) {
        sync()
      }
    }, BOT_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [botNonce, state.phase, state.whoseTurn, state.currentBidder, state.awaitingContinue])

  const api = useMemo(
    () => ({
      newHand: () => {
        const next = pickScene(sceneRef.current.id)
        sceneRef.current = next
        setScene(next)
        gameRef.current.setPlayerNames(namesFromScene(next))
        gameRef.current.startHand()
        sync()
      },
      bid: (bid: Bid) => {
        gameRef.current.humanBid(bid)
        sync()
      },
      play: (card: CardId) => {
        gameRef.current.humanPlay(card)
        sync()
      },
      continueTrick: () => {
        gameRef.current.acknowledgeTrick()
        sync()
      },
      legal: () => gameRef.current.legalForHuman(),
    }),
    [],
  )

  return { state, scene, ...api }
}

export default function App() {
  const { state, scene, newHand, bid, play, continueTrick, legal } = useGame()

  useEffect(() => enableImmersivePwa(), [])

  return (
    <GameTable
      state={state}
      scene={scene}
      legal={legal()}
      onBid={bid}
      onPlay={play}
      onNewHand={newHand}
      onContinue={continueTrick}
    />
  )
}
