import { test, expect } from '@playwright/test';

test.describe('Protected pages (browser, mock backend)', () => {
  test('a visitor who is not logged in is sent from / to the login page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('a visitor who is not logged in is sent from /projects to the login page', async ({ page }) => {
    await page.goto('/projects');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});