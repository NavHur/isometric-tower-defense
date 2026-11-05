/** Where the isometric camera sits; it always looks at the world origin. */
export const CAMERA_POSITION: readonly [number, number, number] = [11, 12, 12]

export interface ScreenUnits {
  /** World units to the right of the canvas centre. */
  x: number
  /** World units below the canvas centre. */
  y: number
}

/**
 * Where a world point lands on screen, as an offset from the canvas centre in
 * world units along the camera's screen axes; multiply by the camera zoom for
 * pixels. The camera is orthographic and looks at the origin, so the origin
 * projects to the centre.
 */
export function projectToScreenUnits([worldX, worldY, worldZ]: readonly [
  number,
  number,
  number,
]): ScreenUnits {
  const [cameraX, cameraY, cameraZ] = CAMERA_POSITION
  const distance = Math.hypot(cameraX, cameraY, cameraZ)
  // Camera basis as three.js builds it: back = position / |position|,
  // right = up x back, upward = back x right, with up = (0, 1, 0).
  const back = [cameraX / distance, cameraY / distance, cameraZ / distance]
  const rightLength = Math.hypot(back[2], back[0])
  const right = [back[2] / rightLength, 0, -back[0] / rightLength]
  const upward = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0],
  ]
  return {
    x: worldX * right[0] + worldY * right[1] + worldZ * right[2],
    y: -(worldX * upward[0] + worldY * upward[1] + worldZ * upward[2]),
  }
}
