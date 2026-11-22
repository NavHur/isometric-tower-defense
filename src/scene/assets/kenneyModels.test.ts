// @vitest-environment node
import { Effect, Layer } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { describe, expect, it } from 'vite-plus/test'
import { KenneyModels, kenneyModelsLayer } from './kenneyModels'

const modelUrl = 'http://localhost/models/grass.glb'
const layer = kenneyModelsLayer.pipe(Layer.provide(FetchHttpClient.layer))
const validManifest = '{"asset":{"version":"2.0"},"scenes":[{"name":"Grass"}]}'

function makeGlb(manifest: string) {
  const length = Math.ceil(manifest.length / 4) * 4
  const bytes = new ArrayBuffer(20 + length)
  const view = new DataView(bytes)
  view.setUint32(0, 1_179_937_895, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, bytes.byteLength, true)
  view.setUint32(12, length, true)
  view.setUint32(16, 1_313_821_514, true)
  new Uint8Array(bytes, 20).set(
    new TextEncoder().encode(manifest.padEnd(length)),
  )
  return bytes
}

function loadModel(response: Response) {
  const fetchModel: typeof fetch = (url) => {
    expect(url).toStrictEqual(new URL(modelUrl))
    return Promise.resolve(response)
  }
  return KenneyModels.pipe(
    Effect.flatMap((models) => models.load(modelUrl)),
    Effect.provide(layer),
    Effect.provideService(FetchHttpClient.Fetch, fetchModel),
  )
}

function loadFailure(response: Response) {
  return Effect.runPromise(loadModel(response).pipe(Effect.flip))
}

describe('KenneyModels', () => {
  it('loads a GLB and returns the scene parsed by Three.js', async () => {
    const response = new Response(makeGlb(validManifest))
    const result = await Effect.runPromise(loadModel(response))
    expect(result.scene.name).toBe('Grass')
  })

  it('reports a failed HTTP status as a download error', async () => {
    const failure = await loadFailure(new Response(null, { status: 404 }))
    expect(failure).toMatchObject({
      _tag: 'ModelLoadError',
      path: modelUrl,
      stage: 'download',
    })
    expect(failure.message).toContain('404')
  })

  it('rejects the static host HTML fallback before parsing', async () => {
    const response = new Response('<!doctype html><html></html>')
    const failure = await loadFailure(response)
    expect(failure.stage).toBe('validation')
    expect(failure.message).toContain('GLB magic')
  })

  it('rejects a truncated chunk even when the header length matches', async () => {
    const bytes = makeGlb(validManifest)
    new DataView(bytes).setUint32(12, bytes.byteLength, true)
    const failure = await loadFailure(new Response(bytes))
    expect(failure.stage).toBe('validation')
    expect(failure.message).toContain('GLB chunk length')
  })

  it('rejects image references outside the kit', async () => {
    const manifest =
      '{"asset":{"version":"2.0"},"images":[{"uri":"https://example.com/texture.png"}]}'
    const response = new Response(makeGlb(manifest))
    const failure = await loadFailure(response)
    expect(failure.stage).toBe('validation')
    expect(failure.message).toContain('Textures/colormap.png')
  })

  it('retains the Three.js error when a framed file cannot be parsed', async () => {
    const manifest =
      '{"asset":{"version":"2.0"},"scenes":[{"nodes":[0]}],"nodes":[{"mesh":0}]}'
    const response = new Response(makeGlb(manifest))
    const failure = await loadFailure(response)
    expect(failure.stage).toBe('parse')
    expect(failure.cause).toBeInstanceOf(Error)
  })
})
