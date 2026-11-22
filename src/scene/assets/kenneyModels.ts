import { Context, Data, Effect, Layer } from 'effect'
import { HttpClient, HttpClientResponse } from 'effect/http'
import { LoaderUtils } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { decodeKenneyGlb } from './kenneyGlb'

const { TaggedError: taggedError } = Data

class ModelLoadError extends taggedError('ModelLoadError')<{
  path: string
  stage: 'download' | 'validation' | 'parse'
  message: string
  cause: unknown
}> {}

const makeKenneyModels = Effect.gen(function* makeModels() {
  const client = yield* HttpClient.HttpClient
  const loader = new GLTFLoader()

  return {
    load: Effect.fn('KenneyModels.load')(function* loadModel(path: string) {
      const bytes = yield* client.get(path).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap((response) => response.arrayBuffer),
        Effect.mapError(
          (cause) =>
            new ModelLoadError({
              path,
              stage: 'download',
              message: cause.message,
              cause,
            }),
        ),
      )
      const glb = yield* decodeKenneyGlb(bytes).pipe(
        Effect.mapError(
          (cause) =>
            new ModelLoadError({
              path,
              stage: 'validation',
              message: cause.message,
              cause,
            }),
        ),
      )
      return yield* Effect.tryPromise({
        try: () => loader.parseAsync(glb, LoaderUtils.extractUrlBase(path)),
        catch: (cause) =>
          new ModelLoadError({
            path,
            stage: 'parse',
            message:
              cause instanceof Error
                ? cause.message
                : 'Three.js could not parse the model',
            cause,
          }),
      })
    }),
  }
})

const { Service: service } = Context

export const KenneyModels =
  service<Effect.Success<typeof makeKenneyModels>>('KenneyModels')
export const kenneyModelsLayer = Layer.effect(KenneyModels, makeKenneyModels)
