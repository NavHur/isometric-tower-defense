import { NormalBlending } from 'three'
import type { Blending } from 'three'
import { MAGIC_BLOOM_COLOR } from './effectPalette'

interface BloomMaterialProps {
  opacity: number
  blending?: Blending
}

/** The unlit, see-through glow every magic effect draws with. */
export function BloomMaterial({
  opacity,
  blending = NormalBlending,
}: BloomMaterialProps) {
  return (
    <meshBasicMaterial
      color={MAGIC_BLOOM_COLOR}
      transparent
      opacity={opacity}
      depthWrite={false}
      blending={blending}
      toneMapped={false}
    />
  )
}
