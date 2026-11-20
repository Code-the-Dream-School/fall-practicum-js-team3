import { test, expect, type Page } from '@playwright/test';
import { registerAndSignIn, signIn, fakeProjectsAnswer, restoreProjectsAnswer } from './browser-helpers';

// Opens the Save dialog from the top bar and returns it
async function openSaveDialog(page: Page) {
  await page.getByRole('button', { name: 'Save project' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Save project' })).toBeVisible();
  return dialog;
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
