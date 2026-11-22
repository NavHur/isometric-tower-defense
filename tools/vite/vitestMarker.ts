import { Config, ConfigProvider, Effect, Option, Schema } from 'effect'

const vitestMarker = Config.option(Config.schema(Schema.String, 'VITEST'))

// Presence marks a Vitest run, so a set but empty VITEST still counts.
export function runsUnderVitest(env: Record<string, string | undefined>) {
  const provider = ConfigProvider.fromEnvRecord(env, {
    preserveEmptyStrings: true,
  })
  return Option.isSome(Effect.runSync(vitestMarker.parse(provider)))
}
