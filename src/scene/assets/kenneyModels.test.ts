// @vitest-environment node
import { Effect, Layer } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { describe, expect, it } from 'vite-plus/test'
import { KenneyModels, kenneyModelsLayer } from './kenneyModels'

const modelUrl = 'http://localhost/models/grass.glb'
const layer = kenneyModelsLayer.pipe(Layer.provide(FetchHttpClient.layer))
const validManifest = '{"asset":{"version":"2.0"},"scenes":[{"name":"Grass"}]}'

const JSON_CHUNK = 1_313_821_514
const BIN_CHUNK = 5_130_562
const OTHER_CHUNK = 0
const INVALID_UTF8_BYTE = 255

function frameGlb(json: Uint8Array) {
  const length = Math.ceil(json.length / 4) * 4
  const bytes = new ArrayBuffer(20 + length)
  const view = new DataView(bytes)
  view.setUint32(0, 1_179_937_895, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, bytes.byteLength, true)
  view.setUint32(12, length, true)
  view.setUint32(16, JSON_CHUNK, true)
  const body = new Uint8Array(bytes, 20)
  body.fill(0x20)
  body.set(json)
  return bytes
}

function makeGlb(manifest: string) {
  return frameGlb(new TextEncoder().encode(manifest))
}

// Appends bytes after the last chunk and keeps the header length consistent.
function withTrailing(bytes: ArrayBuffer, extra: number) {
  const grown = new Uint8Array(bytes.byteLength + extra)
  grown.set(new Uint8Array(bytes))
  new DataView(grown.buffer).setUint32(8, grown.byteLength, true)
  return grown.buffer
}

function withChunk(bytes: ArrayBuffer, type: number) {
  const grown = withTrailing(bytes, 12)
  const view = new DataView(grown)
  view.setUint32(bytes.byteLength, 4, true)
  view.setUint32(bytes.byteLength + 4, type, true)
  return grown
}

function withWord(bytes: ArrayBuffer, offset: number, value: number) {
  new DataView(bytes).setUint32(offset, value, true)
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

  it.each([
    ['a body shorter than the headers', () => new ArrayBuffer(4), 'Truncated'],
    [
      'the wrong version',
      () => withWord(makeGlb(validManifest), 4, 1),
      'version 2',
    ],
    [
      'a header length that disagrees with the body',
      () => withWord(makeGlb(validManifest), 8, 4096),
      'header length',
    ],
    [
      'a trailing partial chunk header',
      () => withTrailing(makeGlb(validManifest), 4),
      'Truncated GLB chunk header',
    ],
    [
      'a misaligned chunk length',
      () => {
        const bytes = makeGlb(validManifest)
        return withWord(bytes, 12, new DataView(bytes).getUint32(12, true) - 1)
      },
      'GLB chunk length',
    ],
    [
      'a first chunk that is not JSON',
      () => withWord(makeGlb(validManifest), 16, OTHER_CHUNK),
      'one JSON chunk, first',
    ],
    [
      'a second JSON chunk',
      () => withChunk(makeGlb(validManifest), JSON_CHUNK),
      'one JSON chunk, first',
    ],
    [
      'a binary chunk that does not follow the JSON chunk',
      () =>
        withChunk(withChunk(makeGlb(validManifest), OTHER_CHUNK), BIN_CHUNK),
      'binary chunk must follow',
    ],
  ])('rejects %s', async (_name, build, message) => {
    const failure = await loadFailure(new Response(build()))
    expect(failure.stage).toBe('validation')
    expect(failure.message).toContain(message)
  })

  it.each([
    ['a manifest that is not JSON', '{', 'JSON'],
    ['a glTF version other than 2.0', '{"asset":{"version":"1.0"}}', '2.0'],
    [
      'an external buffer',
      '{"asset":{"version":"2.0"},"buffers":[{"uri":"x.bin"}]}',
      'uri',
    ],
    [
      'a required extension',
      '{"asset":{"version":"2.0"},"extensionsRequired":["KHR_x"]}',
      'extensionsRequired',
    ],
    [
      'a default scene past the end of the scenes',
      '{"asset":{"version":"2.0"},"scene":1,"scenes":[{}]}',
      'default scene',
    ],
    [
      'a default scene without scenes',
      '{"asset":{"version":"2.0"},"scene":0,"scenes":[]}',
      'default scene',
    ],
    [
      'a manifest without scenes',
      '{"asset":{"version":"2.0"}}',
      'default scene',
    ],
    [
      'empty scenes with the default scene omitted',
      '{"asset":{"version":"2.0"},"scenes":[]}',
      'default scene',
    ],
    [
      'a negative default scene',
      '{"asset":{"version":"2.0"},"scene":-1,"scenes":[{}]}',
      '0',
    ],
  ])('rejects %s in the manifest', async (_name, manifest, message) => {
    const failure = await loadFailure(new Response(makeGlb(manifest)))
    expect(failure.stage).toBe('validation')
    expect(failure.message).toContain(message)
  })

  it('accepts the default scene when its index is omitted', async () => {
    const manifest = '{"asset":{"version":"2.0"},"scenes":[{}]}'
    const response = new Response(makeGlb(manifest))
    const result = await Effect.runPromise(loadModel(response))
    expect(result.scene).toBeDefined()
  })

  it('keeps the decoder error when the JSON chunk is not valid UTF-8', async () => {
    const json = new TextEncoder().encode(validManifest)
    json[validManifest.indexOf('Grass')] = INVALID_UTF8_BYTE
    const failure = await loadFailure(new Response(frameGlb(json)))
    expect(failure.stage).toBe('validation')
    expect(failure.message).toContain('JSON chunk is not valid')
    expect(failure.cause).toMatchObject({ _tag: 'GlbTextError' })
    expect(failure.cause).toHaveProperty('cause', expect.any(TypeError))
  })
})
