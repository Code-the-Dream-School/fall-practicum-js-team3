import { test, expect, type Page } from '@playwright/test';

const PASSWORD = 'password123';

function uniqueEmail() {
  return `save-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function signIn(page: Page) {
  const email = uniqueEmail();
  await page.goto('/register');
  await page.getByLabel('Name').fill('Save Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Saving projects (browser, MSW backend)', () => {
  test('creates a project when the editor has no saved project yet', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');
    await page.getByRole('button', { name: 'Save project' }).click();
    await page.getByLabel('Project name').fill('New robot');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('status')).toHaveText('Saved as "New robot".');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('updates the project that was opened instead of creating a duplicate', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: 'My Projects' }).click();
    await page.getByRole('link', { name: 'Robot', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Robot', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cube' }).click();
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByLabel('Project name')).toHaveValue('Robot');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('status')).toHaveText('Saved as "Robot".');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  const failures = [
    ['400', 'Some project details are invalid. Check the name and try again.'],
    ['401', 'Your session has expired. Please log in again, then retry saving.'],
    ['404', 'This project could not be found. Your design is still here; try saving again.'],
    ['413', 'This design is too large to save. Remove some shapes and try again.'],
    ['500', 'The server could not save your project. Your design is still here; try again.'],
    ['network', 'Cannot reach the server. Your design is still here; check your connection and retry.'],
  ] as const;

  for (const [status, expectedMessage] of failures) {
    test(`keeps the design and offers retry after a ${status} save failure`, async ({ page }) => {
      await signIn(page);
      await page.getByRole('link', { name: 'My Projects' }).click();
      await page.getByRole('link', { name: 'Robot', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Robot', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Cube' }).click();
      await page.getByRole('button', { name: 'Save project' }).click();
      await page.getByLabel('Project name').fill(`SIMULATE_ERROR_${status.toUpperCase()}`);
      await page.getByRole('button', { name: 'Save', exact: true }).click();

      await expect(page.getByRole('alert')).toHaveText(expectedMessage);
      await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
      await expect(page.getByRole('status')).toHaveText('Unsaved changes.');
    });
  }

  test('asks before leaving with unsaved design changes', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Cube' }).click();
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss();
    });
    await page.getByRole('link', { name: 'My Projects' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');
  });
});
