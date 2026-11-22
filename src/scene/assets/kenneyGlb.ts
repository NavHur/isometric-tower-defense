import { Effect, Schema, SchemaGetter, SchemaIssue } from 'effect'
import {
  Array as array,
  Literal as literal,
  Never,
  Struct as struct,
  Tuple as tuple,
} from 'effect/Schema'

const HEADER_BYTES = 12
const CHUNK_HEADER_BYTES = 8
// The magic and chunk types are little-endian four-character codes.
const GLB_MAGIC = 1_179_937_895
const GLB_VERSION = 2
const JSON_CHUNK = 1_313_821_514
const BIN_CHUNK = 5_130_562

function checkChunk(view: DataView, offset: number, length: number) {
  const kind = view.getUint32(offset + 4, true)
  if (
    length % 4 !== 0 ||
    offset + CHUNK_HEADER_BYTES + length > view.byteLength
  ) {
    return 'Invalid GLB chunk length'
  }
  if ((offset === HEADER_BYTES) !== (kind === JSON_CHUNK)) {
    return 'GLB must have exactly one JSON chunk, first'
  }
  const startAfterJson =
    HEADER_BYTES + CHUNK_HEADER_BYTES + view.getUint32(HEADER_BYTES, true)
  if (kind === BIN_CHUNK && offset !== startAfterJson) {
    return 'GLB binary chunk must follow the JSON chunk'
  }
  return true
}

function checkChunks(view: DataView) {
  let offset = HEADER_BYTES
  while (offset < view.byteLength) {
    if (offset + CHUNK_HEADER_BYTES > view.byteLength) {
      return 'Truncated GLB chunk header'
    }
    const length = view.getUint32(offset, true)
    const result = checkChunk(view, offset, length)
    if (result !== true) return result
    offset += CHUNK_HEADER_BYTES + length
  }
  return true
}

const GlbContainer = Schema.instanceOf(ArrayBuffer).check(
  Schema.makeFilter((bytes) => {
    if (bytes.byteLength < HEADER_BYTES + CHUNK_HEADER_BYTES) {
      return 'Truncated GLB container'
    }
    const view = new DataView(bytes)
    if (view.getUint32(0, true) !== GLB_MAGIC) return 'Expected GLB magic'
    if (view.getUint32(4, true) !== GLB_VERSION) return 'Expected GLB version 2'
    if (view.getUint32(8, true) !== bytes.byteLength) {
      return 'GLB header length does not match the response body'
    }
    return checkChunks(view)
  }),
)

const gltfVersion = literal('2.0')
const assetVersion = struct({
  version: gltfVersion,
  minVersion: Schema.optionalKey(gltfVersion),
})
const buffer = struct({ uri: Schema.optionalKey(Never) })
const image = struct({ uri: literal('Textures/colormap.png') })
const sceneIndex = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))
const sceneEntry = struct({})
const manifest = struct({
  asset: assetVersion,
  scene: Schema.optionalKey(sceneIndex),
  scenes: Schema.optionalKey(array(sceneEntry)),
  buffers: Schema.optionalKey(array(buffer)),
  images: Schema.optionalKey(array(image)),
  extensionsRequired: Schema.optionalKey(tuple([])),
})
const sceneInRange = Schema.makeFilter<typeof manifest.Type>(
  ({ scene, scenes }) =>
    scene === undefined ||
    scene < (scenes?.length ?? 0) ||
    'GLB default scene is outside its scenes',
)
const checkedManifest = manifest.check(sceneInRange)

const utf8 = new TextDecoder('utf-8', { fatal: true })
const Utf8Text = Schema.Uint8Array.pipe(
  Schema.decodeTo(Schema.String, {
    decode: SchemaGetter.transformEffect((bytes, options) =>
      Effect.try({
        try: () => utf8.decode(bytes),
        catch: () =>
          new SchemaIssue.InvalidValue(
            { message: 'GLB JSON chunk is not valid UTF-8' },
            bytes,
            options,
          ),
      }),
    ),
    encode: SchemaGetter.transform((text) => new TextEncoder().encode(text)),
  }),
)

const decodeContainer = Schema.decodeUnknownEffect(GlbContainer)
const manifestFromJson = Schema.fromJsonString(checkedManifest)
const decodeManifest = Schema.decodeUnknownEffect(
  Utf8Text.pipe(Schema.decodeTo(manifestFromJson)),
)

export const decodeKenneyGlb = Effect.fn('decodeKenneyGlb')(function* decode(
  input: unknown,
) {
  const bytes = yield* decodeContainer(input)
  const jsonLength = new DataView(bytes).getUint32(HEADER_BYTES, true)
  const json = new Uint8Array(
    bytes,
    HEADER_BYTES + CHUNK_HEADER_BYTES,
    jsonLength,
  )
  yield* decodeManifest(json)
  return bytes
})
