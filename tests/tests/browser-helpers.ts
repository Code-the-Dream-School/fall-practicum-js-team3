import { expect, type Page } from '@playwright/test';

// Helpers shared by the browser test files (*-browser.spec.ts).
// This file has no tests itself, so Playwright does not run it.

// Values used by many tests, so they are easy to change in one place
export const TEST_NAME = 'Test User';
export const TEST_PASSWORD = 'password123';
export const GREETING = `Hello, ${TEST_NAME}`;

// A new email for every call, so tests never depend on each other
export function uniqueEmail() {
  return `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

// The fake accounts live in memory and start empty on every page load,
// so each test creates its own account and only clicks links afterwards (no page.goto).
export async function registerAccount(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('Name').fill(TEST_NAME);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function signIn(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(GREETING)).toBeVisible();
}

// Creates an account, signs in and returns the email (so a test can sign in again)
export async function registerAndSignIn(page: Page) {
  const email = uniqueEmail();
  await registerAccount(page, email);
  await signIn(page, email);
  return email;
}

// Playwright's own request interception does not see requests answered by the mock service worker,
// so the answer for the projects requests is replaced inside the page (as in our manual tests).
export async function fakeProjectsAnswer(page: Page, status: number, body: unknown) {
  await page.evaluate(({ status, body }) => {
    const w = window as unknown as { __realFetch?: typeof fetch };
    w.__realFetch = w.__realFetch ?? window.fetch.bind(window);
    const realFetch = w.__realFetch;

    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/api/projects')) {
        return Promise.resolve(
          new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return realFetch(input, init);
    };
  }, { status, body });
}

// Puts the real fetch back, so the next request gets the normal mock answer
export async function restoreProjectsAnswer(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __realFetch?: typeof fetch };
    if (w.__realFetch) window.fetch = w.__realFetch;
  });
}
