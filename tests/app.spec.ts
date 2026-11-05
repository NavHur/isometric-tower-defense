import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { BOARD_CENTER_OFFSET } from '../src/game/config/map.ts'
import type { HexPosition } from '../src/game/types/towerDefense.ts'
import { hexToWorld } from '../src/game/utils/hexCoordinates.ts'
import { BUILD_TARGET_LIFT } from '../src/scene/board/buildTarget.ts'
import { baselineZoom } from '../src/scene/camera/baselineZoom.ts'
import { projectToScreenUnits } from '../src/scene/camera/cameraView.ts'
import type { ScreenUnits } from '../src/scene/camera/cameraView.ts'

/** Collects uncaught page errors and console errors as they happen. */
function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

/** Grass hex beside the path cells (-1, 4) and (0, 3). */
const BUILD_HEX: HexPosition = { q: -1, r: 3 }

/**
 * Where the build hex's click target sits on screen, as an offset from the
 * canvas centre in world units: the hex in world space, shifted by the
 * board's centring and the target's lift above the tile, then projected
 * through the isometric camera.
 */
function buildHexScreenUnits(): ScreenUnits {
  const [x, , z] = hexToWorld(BUILD_HEX)
  return projectToScreenUnits([
    x + BOARD_CENTER_OFFSET[0],
    BUILD_TARGET_LIFT,
    z + BOARD_CENTER_OFFSET[2],
  ])
}

/** Clicks the build hex through the canvas, where the raycaster finds it. */
async function clickBuildHex(page: Page): Promise<void> {
  const box = await page.getByTestId('game-container').boundingBox()
  if (!box) throw new Error('game container has no bounding box')
  const zoom = baselineZoom(box.width, box.height)
  const units = buildHexScreenUnits()
  await page.mouse.click(
    box.x + box.width / 2 + units.x * zoom,
    box.y + box.height / 2 + units.y * zoom,
  )
}

/** Reads the number shown under the HUD label, such as Gold or Threats. */
async function readResource(page: Page, label: string): Promise<number> {
  const text = await page
    .getByRole('term')
    .filter({ hasText: label })
    .locator('xpath=following-sibling::dd')
    .textContent()
  return Number(text)
}

/**
 * Clicks the build hex and returns the gold left. The board's models load
 * asynchronously with no DOM signal, so a click before they mount is a no-op;
 * polling this retries until the tower is placed. Clicking an occupied hex
 * does nothing, so repeats cannot build twice.
 */
async function buildAndReadGold(page: Page): Promise<number> {
  await clickBuildHex(page)
  return readResource(page, 'Gold')
}

/** Counts the animation frames the page renders in one second, in the page. */
const COUNT_FRAMES_FOR_ONE_SECOND = `new Promise((resolve) => {
  const start = performance.now()
  let frames = 0
  const tick = () => {
    frames += 1
    if (performance.now() - start < 1000) requestAnimationFrame(tick)
    else resolve(frames)
  }
  requestAnimationFrame(tick)
})`

/**
 * Wave 1's first kill from the build hex takes 11.05 s of game time
 * (simulated in advanceGame). GameLoop advances at most 0.25 s per rendered
 * frame, so the kill needs at least 44 frames: about 11 s at 4 fps or more,
 * but 44 s at 1 fps on a software-rendered CI runner.
 */
const FIRST_KILL_TIMEOUT_MS = 80_000
const BUILD_TIMEOUT_MS = 15_000
/** Page load, the HUD reads and the one-second frame-rate probe. */
const SETUP_HEADROOM_MS = 15_000
/** Sums every wait, so the kill poll can use all of its budget before the test aborts. */
const COMBAT_TEST_TIMEOUT_MS =
  SETUP_HEADROOM_MS + BUILD_TIMEOUT_MS + FIRST_KILL_TIMEOUT_MS

test('places a tower and fights a wave without browser errors', async ({
  page,
}) => {
  test.setTimeout(COMBAT_TEST_TIMEOUT_MS)
  const errors = collectBrowserErrors(page)
  await page.goto('/')
  await expect(page.getByTestId('game-container')).toBeVisible()
  const startingGold = await readResource(page, 'Gold')
  await page.getByRole('button', { name: 'Build tower' }).click()
  await expect
    .poll(() => buildAndReadGold(page), { timeout: BUILD_TIMEOUT_MS })
    .toBeLessThan(startingGold)
  const goldAfterBuild = await readResource(page, 'Gold')
  // Recorded so a timeout below can be told apart from a combat regression.
  const framesPerSecond = await page.evaluate<number>(
    COUNT_FRAMES_FOR_ONE_SECOND,
  )
  test.info().annotations.push({
    type: 'frame rate before wave 1',
    description: `${framesPerSecond} fps`,
  })

  await page.getByRole('button', { name: 'Start wave 1' }).click()
  // Gold only rises above the post-build balance when the tower's shots land
  // and kill an enemy, so this proves projectiles and impacts ran.
  await expect
    .poll(() => readResource(page, 'Gold'), {
      timeout: FIRST_KILL_TIMEOUT_MS,
    })
    .toBeGreaterThan(goldAfterBuild)
  expect(errors).toEqual([])
})

test('runs the tower defense controls without browser errors', async ({
  page,
}) => {
  const errors = collectBrowserErrors(page)
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Hold the Line' }),
  ).toBeVisible()
  await expect(page.getByTestId('game-container')).toBeVisible()
  await expect(page.getByText('150')).toBeVisible()
  await page.getByRole('button', { name: 'Build tower' }).click()
  await expect(page.getByRole('button', { name: 'Building…' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Start wave 1' }).click()
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await expect(page.getByText('Simulation paused')).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  expect(errors).toEqual([])
})
