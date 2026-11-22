import { useLoader } from '@react-three/fiber'
import { Cause, Effect, Exit, Layer, ManagedRuntime } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { Loader } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { KenneyModels, kenneyModelsLayer } from './kenneyModels'
import { MODEL_PATHS } from './modelPaths'

const runtime = ManagedRuntime.make(
  kenneyModelsLayer.pipe(Layer.provide(FetchHttpClient.layer)),
)

class KenneyModelLoader extends Loader<GLTF> {
  override load(
    ...[path, onLoad, , onError = globalThis.reportError]: Parameters<
      Loader<GLTF>['load']
    >
  ) {
    const load = KenneyModels.pipe(
      Effect.flatMap((models) => models.load(path)),
    )
    runtime.runCallback(load, {
      onExit: Exit.match({
        onSuccess: onLoad,
        onFailure: (cause) => onError(Cause.squash(cause)),
      }),
    })
  }
}

export function preloadKenneyModels() {
  for (const path of Object.values(MODEL_PATHS)) {
    useLoader.preload(KenneyModelLoader, path)
  }
}

export function useKenneyModel(path: string) {
  return useLoader(KenneyModelLoader, path)
}
