import { TOWER_STATS } from '../game/config/balance'
import { useGameStore } from '../game/state/useGameStore'

interface BuildButtonState {
  isSelected: boolean
  canAfford: boolean
}

function buildButtonLabel({ isSelected, canAfford }: BuildButtonState) {
  if (isSelected) return 'Building…'
  return canAfford ? 'Build tower' : 'Need gold'
}

export function BuildTray() {
  const selectedBuild = useGameStore((state) => state.selectedBuild)
  const placementMessage = useGameStore((state) => state.placementMessage)
  const currency = useGameStore((state) => state.currency)
  const selectBuild = useGameStore((state) => state.selectBuild)
  const isSelected = selectedBuild === 'pulseTower'
  const canAfford = currency >= TOWER_STATS.pulseTower.cost

  return (
    <section className="build-tray" aria-label="Build towers">
      <div className="build-heading">
        <div>
          <p className="utility-label">Build</p>
          <h2>Rune tower</h2>
        </div>
        <span className="tower-cost">{TOWER_STATS.pulseTower.cost} gold</span>
      </div>
      <p className="tower-summary">
        A focused crystal spire that strikes the lead creature.
      </p>
      <div className="build-actions">
        <button
          type="button"
          className={`build-button${isSelected ? ' is-selected' : ''}`}
          aria-pressed={isSelected}
          disabled={!canAfford && !isSelected}
          onClick={() => selectBuild(isSelected ? null : 'pulseTower')}
        >
          {buildButtonLabel({ isSelected, canAfford })}
        </button>
        {isSelected ? (
          <button
            type="button"
            className="text-button"
            onClick={() => selectBuild(null)}
          >
            Cancel
          </button>
        ) : null}
      </div>
      <p className="placement-message" aria-live="polite">
        {placementMessage ?? 'Select the tower, then choose an open grass hex.'}
      </p>
    </section>
  )
}
