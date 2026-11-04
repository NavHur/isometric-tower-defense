import { TOWER_STATS } from '../config/balance'
import type { EnemyState, TowerState } from '../types/towerDefense'
import { worldDistance } from '../utils/hexCoordinates'
import { pathProgressToHexPoint } from '../utils/pathProgressToHexPoint'

export function selectTarget(
  tower: TowerState,
  enemies: readonly EnemyState[],
): EnemyState | null {
  const { range } = TOWER_STATS[tower.kind]
  const candidates = enemies.filter((enemy) => {
    if (enemy.health <= 0) return false
    const point = pathProgressToHexPoint(enemy.pathProgress)
    return worldDistance(point, tower.position) <= range
  })

  candidates.sort(
    (left, right) =>
      right.pathProgress - left.pathProgress || left.id.localeCompare(right.id),
  )
  return candidates[0] ?? null
}
