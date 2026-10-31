# Hold the Line

A playable low-poly fantasy tower-defense prototype on an organic Kenney hex island. Build rune towers beside an enchanted S-curve, defend ten lives through three waves, and stop goblins and slimes before they reach the castle.

## Technology

React, TypeScript, Three.js, React Three Fiber, Drei, Zustand, Testing Library, and Playwright. [Vite+](https://viteplus.dev) (`vp`) runs the dev server, build, Vitest, Oxlint, and Oxfmt, with Bun as the package manager. The build deploys as a Cloudflare Worker that serves static assets.

## Setup

Requires [Vite+](https://viteplus.dev/guide/) and a browser with WebGL support. `vp` installs the Bun version pinned in `package.json`.

```bash
vp install
vp dev
```

## Controls

- Select **Build tower**, then click or tap an open grass hex.
- Press Escape, right-click the game, or select **Cancel** to leave build mode.
- Use **Start wave** to release each authored wave.
- Use **Pause** and **Resume** during an active wave.
- Scroll or pinch to zoom. Camera rotation and panning are locked.

## Validation

```bash
vp check          # format, lint, and type checks
vp test run       # unit tests (`vp test` watches)
vp run build      # tsc -b, then the Worker build in dist/
vp run test:e2e   # Playwright against the build, served by workerd
```

`vp run check` runs the first three in order. `vp check --fix` applies formatting and lint fixes.

## Deployment

`wrangler.jsonc` declares an assets-only Worker with single-page-app fallback. After `vp run build`, `vp exec wrangler deploy` publishes `dist/` using the generated `dist/wrangler.json`.

## Project map

- `src/game/config` — axial island, waves, and balance values
- `src/game/utils` — axial coordinates, route expansion, and interpolation
- `src/game/rules` — pure placement and targeting decisions
- `src/game/actions` — deterministic simulation transitions
- `src/game/state` — serializable Zustand state and named actions
- `src/scene` — React Three Fiber world, fantasy actors, and effects
- `src/ui` — accessible resources, building, wave, and end-state controls
- `public/models/kenney` — runtime Kenney assets and licenses
- `docs` — architecture and asset conventions

## Prototype balance

Runs start with 150 gold and 10 lives. Rune towers cost 50 gold, prioritize the in-range creature closest to the castle, and remain in place for the run. Three manual waves introduce standard goblins and faster slimes. Kills award gold; leaked creatures remove one life.

## Assets and limits

The island and fantasy structures use Kenney's CC0 Hexagon Kit 2.0. See [the asset manifest](docs/assets.md). The prototype currently excludes dynamic pathfinding, tower upgrades or selling, additional playable tower classes, bosses, fast-forward, audio, saved progress, level selection, procedural maps, physics, backend services, authentication, and multiplayer.
