import { MapControls, OrthographicCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { baselineZoom } from './baselineZoom'

const CAMERA_POSITION: readonly [number, number, number] = [11, 12, 12]

export function IsometricCamera() {
  const { height, width } = useThree((state) => state.size)
  const zoom = baselineZoom(width, height)

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={CAMERA_POSITION}
        zoom={zoom}
        near={0.1}
        far={100}
        onUpdate={(camera) => camera.lookAt(0, 0, 0)}
      />
      <MapControls
        enablePan={false}
        enableRotate={false}
        enableDamping
        dampingFactor={0.08}
        minZoom={zoom}
        maxZoom={zoom * 1.6}
        target={[0, 0, 0]}
      />
    </>
  )
}
