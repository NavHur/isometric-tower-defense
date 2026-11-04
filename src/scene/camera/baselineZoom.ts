/** Pixels per world unit that fits the whole board in a canvas this size. */
export function baselineZoom(width: number, height: number): number {
  return Math.max(15, Math.min(62, width / 25, height / 17.5))
}
