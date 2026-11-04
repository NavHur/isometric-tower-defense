import { useEffect } from 'react'
import { useGameStore } from '../game/state/useGameStore'
import { GameCanvas } from '../scene/GameCanvas'
import { GameHud } from '../ui/GameHud'

export function App() {
  useEffect(() => {
    const cancelBuild = (event: KeyboardEvent) => {
      if (event.key === 'Escape') useGameStore.getState().selectBuild(null)
    }
    globalThis.addEventListener('keydown', cancelBuild)
    return () => globalThis.removeEventListener('keydown', cancelBuild)
  }, [])

  return (
    <main className="game-shell">
      <GameCanvas />
      <GameHud />
    </main>
  )
}
