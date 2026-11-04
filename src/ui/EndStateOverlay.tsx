import { useGameStore } from '../game/state/useGameStore'

export function EndStateOverlay() {
  const phase = useGameStore((state) => state.phase)
  const restart = useGameStore((state) => state.restart)
  if (phase !== 'victory' && phase !== 'defeat') return null

  const won = phase === 'victory'
  return (
    <dialog
      open
      className="end-overlay"
      aria-modal="true"
      aria-labelledby="end-title"
    >
      <p className="utility-label">{won ? 'Realm secure' : 'Defense failed'}</p>
      <h2 id="end-title">
        {won ? 'All waves cleared' : 'The stronghold was breached'}
      </h2>
      <p>
        {won
          ? 'Every creature was stopped before the castle gate.'
          : 'Rebuild your formation and protect the enchanted pass.'}
      </p>
      <button type="button" className="primary-action" onClick={restart}>
        Play again
      </button>
    </dialog>
  )
}
