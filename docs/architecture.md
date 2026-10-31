# Architecture

## Foundation

React owns the HTML interface and React Three Fiber scene graph. Vite+ supplies the static TypeScript build, which a Cloudflare Worker serves as static assets. Three.js provides real-time 3D rendering, while Zustand coordinates a small serializable game snapshot.

## Deterministic simulation

`GameLoop` accumulates frame time and advances the game in fixed 0.05-second steps, capped to 0.25 seconds of catch-up per rendered frame. Pure transitions under `src/game/actions` handle spawning, movement, projectile arrival, damage, rewards, leaks, and phase changes. Deterministic counters produce entity IDs, so equivalent inputs produce equivalent runs.

## Axial hex island and route

The island is the union of five authored axial-coordinate lobes. Its 149 terrain hexes form a broad asymmetric crescent, while the neighboring water ring is derived automatically from missing axial neighbors. Enemies follow an authored 26-cell S-curve whose direction changes are limited to gentle 60-degree turns.

Enemy position is stored as scalar `pathProgress`; `pathProgressToHexPoint` produces a fractional axial point for range checks and rendering. `hexToWorld` maps pointy axial coordinates to the Kenney tile dimensions only at the rendering boundary. A derived board offset centers the irregular island without putting Three.js vectors into game state.

## Rules and rendering boundary

`src/game` decides whether placement is legal, which enemy a tower targets, when a projectile hits, and whether a run is won or lost. `src/scene` renders those decisions, derives transforms, dispatches named actions, and may perform visual interpolation. Three.js objects remain outside Zustand to preserve serializability and deterministic tests.

## State ownership

Zustand owns logical towers, enemies, projectiles, resources, phase, wave queue, hover, and build selection. Components use narrow selectors. Static model paths, map layout, and balance values remain module constants rather than duplicated state.

## Adding content

A new enemy kind requires typed stats, a wave reference, and a scene creature mapping. A new tower kind requires typed stats, placement UI, and its scene wrapper; shared targeting and projectile rules should be extended only when the new design differs. Future backend synchronization would exchange serializable commands and snapshots at the action/store boundary, never renderer objects.
