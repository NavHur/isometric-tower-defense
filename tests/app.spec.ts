import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Collects uncaught page errors and console errors as they happen. */
function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

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
