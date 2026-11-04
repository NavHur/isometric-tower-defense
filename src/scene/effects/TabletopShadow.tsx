const SHADOW_LAYERS = [
  { opacity: 0.025, scale: 1 },
  { opacity: 0.04, scale: 0.72 },
  { opacity: 0.065, scale: 0.43 },
] as const

interface TabletopShadowProps {
  radius: number
  y: number
}

export function TabletopShadow({ radius, y }: TabletopShadowProps) {
  return SHADOW_LAYERS.map((layer, index) => (
    <mesh
      key={layer.scale}
      position={[0, y + index * 0.0005, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={radius * layer.scale}
      renderOrder={1}
    >
      <circleGeometry args={[1, 24]} />
      <meshBasicMaterial
        color="#243247"
        transparent
        opacity={layer.opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  ))
}
