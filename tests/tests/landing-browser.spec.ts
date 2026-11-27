import { test, expect } from '@playwright/test';

// The landing page is the first page a visitor sees at "/"
const HEADLINE = 'Big ideas start with simple shapes.';

test.describe('Landing page (browser, mock backend)', () => {
  test('a visitor sees the headline, the top bar and the footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: HEADLINE })).toBeVisible();
    await expect(page.getByRole('link', { name: 'BlockCAD', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();
    await expect(page.getByText('© BlockCAD Team 3, December 2026')).toBeVisible();
  });

  test('Log in in the top bar opens the login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Log in', exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('Sign up in the top bar opens the registration page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Sign up', exact: true }).click();

    await expect(page).toHaveURL(/\/register$/);
  });

  test('Start building opens the registration page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Start building', exact: true }).click();

    await expect(page).toHaveURL(/\/register$/);
  });

  test('About scrolls to the About section and Create account opens the registration page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'What is BlockCAD?' })).toBeInViewport();

    await page.getByRole('link', { name: 'Create account', exact: true }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('the logo scrolls back to the top of the page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'What is BlockCAD?' })).toBeInViewport();

    await page.getByRole('link', { name: 'BlockCAD', exact: true }).click();

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { level: 1, name: HEADLINE })).toBeInViewport();
  });

    test('the landing page can be scrolled with the mouse wheel', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: HEADLINE })).toBeVisible();
    await page.mouse.move(400, 400);
  });
});