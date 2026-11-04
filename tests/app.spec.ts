import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { baselineZoom } from '../src/scene/camera/baselineZoom.ts'

/** Collects uncaught page errors and console errors as they happen. */
function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

/**
 * Grass hex (q -1, r 3), beside the path cells (-1, 4) and (0, 3), as an
 * offset from the canvas centre in world units along the camera's screen
 * axes. Derived from `hexToWorld`, `BOARD_CENTER_OFFSET` and the isometric
 * camera at (11, 12, 12) looking at the origin; y is down.
 */
const BUILD_HEX_SCREEN_UNITS = { x: -1.9722, y: 1.5185 }

/** Clicks the build hex through the canvas, where the raycaster finds it. */
async function clickBuildHex(page: Page): Promise<void> {
  const box = await page.getByTestId('game-container').boundingBox()
  if (!box) throw new Error('game container has no bounding box')
  const zoom = baselineZoom(box.width, box.height)
  await page.mouse.click(
    box.x + box.width / 2 + BUILD_HEX_SCREEN_UNITS.x * zoom,
    box.y + box.height / 2 + BUILD_HEX_SCREEN_UNITS.y * zoom,
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

test('places a tower and fights a wave without browser errors', async ({
  page,
}) => {
  const errors = collectBrowserErrors(page)
  await page.goto('/')
  await expect(page.getByTestId('game-container')).toBeVisible()
  const startingGold = await readResource(page, 'Gold')
  await page.getByRole('button', { name: 'Build tower' }).click()
  await expect
    .poll(() => buildAndReadGold(page), { timeout: 15_000 })
    .toBeLessThan(startingGold)
  const goldAfterBuild = await readResource(page, 'Gold')

  await page.getByRole('button', { name: 'Start wave 1' }).click()
  // Gold only rises above the post-build balance when the tower's shots land
  // and kill an enemy, so this proves projectiles and impacts ran.
  await expect
    .poll(() => readResource(page, 'Gold'), { timeout: 25_000 })
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
