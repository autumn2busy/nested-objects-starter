import { test, expect } from '@playwright/test'

const loginUrlPattern = /nested-objects\.outseta\.com\/auth/

test('login CTA points to Outseta auth', async ({ page }) => {
  await page.goto('/directory')
  const loginLink = page.getByRole('link', { name: /login/i }).first()
  await expect(loginLink).toHaveAttribute('href', loginUrlPattern)
})

test('auth form accepts credentials when provided', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  test.skip(!email || !password, 'E2E credentials not set')

  await page.goto('/directory')
  await page.getByRole('link', { name: /login/i }).first().click()
  await page.waitForURL(loginUrlPattern)

  await page.getByLabel(/email/i).fill(email ?? '')
  await page.getByLabel(/password/i).fill(password ?? '')
  await page.getByRole('button', { name: /log in|sign in/i }).click()

  await expect(page).not.toHaveURL(loginUrlPattern)
})
