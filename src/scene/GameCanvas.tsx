import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Suspense } from 'react'
import { GameScene } from './GameScene'
import { useGameStore } from '../game/state/useGameStore'
import { MODEL_PATHS } from './assets/modelPaths'

for (const path of Object.values(MODEL_PATHS)) useGLTF.preload(path)

export function GameCanvas() {
  return (
    <div
      className="game-canvas"
      data-testid="game-container"
      onContextMenu={(event) => {
        event.preventDefault()
        useGameStore.getState().selectBuild(null)
      }}
    >
      <Canvas
        dpr={[1, 2]}
        shadows="basic"
        gl={{ antialias: true }}
        fallback={
          <p className="webgl-fallback">
            WebGL is required to view the game board.
          </p>
        }
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
