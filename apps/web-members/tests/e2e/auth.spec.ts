import { expect, test } from '@playwright/test'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('auth flow logs in and lands on the app', async ({ page }) => {
  const loginUrl = process.env.E2E_LOGIN_URL
  const email = process.env.E2E_AUTH_EMAIL
  const password = process.env.E2E_AUTH_PASSWORD

  const missing: string[] = []
  if (!loginUrl) missing.push('E2E_LOGIN_URL')
  if (!email) missing.push('E2E_AUTH_EMAIL')
  if (!password) missing.push('E2E_AUTH_PASSWORD')

  test.skip(missing.length > 0, `Missing env vars: ${missing.join(', ')}`)

  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
  const postLoginPath = process.env.E2E_POST_LOGIN_PATH ?? '/'
  const expectedUrl = new URL(postLoginPath, baseURL)
  const expectedUrlPattern = new RegExp(
    `^${escapeRegExp(expectedUrl.origin)}${escapeRegExp(expectedUrl.pathname)}`,
  )

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' })

  const emailField = page
    .getByLabel(/email/i)
    .or(page.locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]'))
    .first()
  const passwordField = page
    .getByLabel(/password/i)
    .or(page.locator('input[type="password"]'))
    .first()

  await emailField.fill(email)
  await passwordField.fill(password)

  const submitButton = page
    .getByRole('button', { name: /log in|sign in|continue/i })
    .or(page.locator('input[type="submit"]'))
    .first()

  await Promise.all([
    page.waitForURL(expectedUrlPattern, { timeout: 60_000 }),
    submitButton.click(),
  ])

  await expect(page).toHaveURL(expectedUrlPattern)
})
