import { test, expect, type Page } from '@playwright/test';

// Values used by many tests, so they are easy to change in one place
const TEST_NAME = 'Test User';
const TEST_PASSWORD = 'password123';
const GREETING = `Hello, ${TEST_NAME}`;

// A new email for every call, so tests never depend on each other
function uniqueEmail() {
  return `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

// The fake accounts live in memory and start empty on every page load,
// so each test creates its own account and only clicks links afterwards (no page.goto).
async function registerAccount(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('Name').fill(TEST_NAME);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function signIn(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(GREETING)).toBeVisible();
}

// Creates an account, signs in and returns the email (so a test can sign in again)
async function registerAndSignIn(page: Page) {
  const email = uniqueEmail();
  await registerAccount(page, email);
  await signIn(page, email);
  return email;
}

// Opens the Save dialog from the top bar and returns it
async function openSaveDialog(page: Page) {
  await page.getByRole('button', { name: 'Save project' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Save project' })).toBeVisible();
  return dialog;
}

// Playwright's own request interception does not see requests answered by the mock service worker,
// so the answer for the projects requests is replaced inside the page (as in our manual tests).
async function fakeProjectsAnswer(page: Page, status: number, body: unknown) {
  await page.evaluate(({ status, body }) => {
    const w = window as unknown as { __realFetch?: typeof fetch };
    w.__realFetch = w.__realFetch ?? window.fetch.bind(window);
    const realFetch = w.__realFetch;

    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/projects')) {
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
async function restoreProjectsAnswer(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __realFetch?: typeof fetch };
    if (w.__realFetch) window.fetch = w.__realFetch;
  });
}

test.describe('Save dialog (browser, mock backend)', () => {
  test('an empty project name shows an error and the dialog stays open', async ({ page }) => {
    await registerAndSignIn(page);
    const dialog = await openSaveDialog(page);

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('Please enter a project name.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('a project name longer than 100 characters is rejected', async ({ page }) => {
    await registerAndSignIn(page);
    const dialog = await openSaveDialog(page);

    await dialog.getByLabel('Project name').fill('a'.repeat(101));
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('Project name must be at most 100 characters.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('Cancel closes the dialog and nothing is saved', async ({ page }) => {
    await registerAndSignIn(page);
    const dialog = await openSaveDialog(page);
    await dialog.getByLabel('Project name').fill('Not saved');

    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(/^Saved as/)).toHaveCount(0);
  });

  test('the Escape key closes the dialog', async ({ page }) => {
    await registerAndSignIn(page);
    const dialog = await openSaveDialog(page);

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
  });

  test('a failed save shows a problem inside the dialog, and saving again works', async ({ page }) => {
    await registerAndSignIn(page);
    const dialog = await openSaveDialog(page);
    await dialog.getByLabel('Project name').fill('Retry robot');

    // The server fails: the dialog stays open and shows the problem
    await fakeProjectsAnswer(page, 500, { error: { code: 'SERVER_ERROR', message: 'Server error' } });
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog).toBeVisible();

    // The problem is gone: saving again works
    await restoreProjectsAnswer(page);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Saved as "Retry robot".')).toBeVisible();
  });
});

test.describe('Editor after logout (browser, mock backend)', () => {
  test('the editor is empty after logging out and signing in again', async ({ page }) => {
    const email = await registerAndSignIn(page);

    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByText('Unsaved changes.')).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await signIn(page, email);
    await expect(page.getByRole('button', { name: 'Save project' })).toBeVisible();
    
    // The design of the previous visit is gone
    await expect(page.getByText('Unsaved changes.')).toHaveCount(0);
  });
});