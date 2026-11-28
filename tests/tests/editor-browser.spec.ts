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

test('loads and saves legacy blocks with missing and existing rotations', async ({ page }) => {
  await registerAndSignIn(page);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const rotation = { x: 0.2, y: -0.5, z: 1 };
  const blocks = [
    { id: 1, type: 'cube', color: '#0ea5e9', position: { x: 0, y: 0, z: 0 }, scale: 1 },
    { id: 2, type: 'sphere', color: '#ef4444', position: { x: 2, y: 0, z: 0 }, scale: 1, rotation },
    { id: 3, type: 'cylinder', color: '#10b981', position: { x: 4, y: 0, z: 0 }, scale: 1 },
  ];

  await page.evaluate((legacyBlocks) => {
    const w = window as unknown as { __realFetch?: typeof fetch };
    w.__realFetch = window.fetch.bind(window);
    const realFetch = w.__realFetch;
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith('/api/projects/project_11') && (!init?.method || init.method === 'GET')) {
        return Promise.resolve(new Response(JSON.stringify({
          id: 'project_11', name: 'x', createdAt: '2026-10-28T17:00:00Z',
          updatedAt: '2026-10-31T20:45:00Z', design: { version: 1, blocks: legacyBlocks },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return realFetch(input, init);
    };
  }, blocks);

  await page.getByRole('link', { name: 'My Projects' }).click();
  await page.getByRole('link', { name: 'x', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'x', exact: true })).toBeVisible();
  await expect(page.locator('.canvas-wrapper canvas')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Saved as "x".');

  await restoreProjectsAnswer(page);
  await page.getByRole('button', { name: 'Cube' }).click();
  await page.getByRole('button', { name: 'Save project' }).click();
  const response = page.waitForResponse((result) =>
    result.url().endsWith('/api/projects/project_11') && result.request().method() === 'PUT',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  const saveResponse = await response;
  const saved = await saveResponse.json() as { design: { blocks: { rotation: typeof rotation }[] } };
  expect(saved.design.blocks.map((block) => block.rotation)).toEqual([
    { x: 0, y: 0, z: 0 }, rotation, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 },
  ]);
  await expect(page.getByRole('status')).toHaveText('Saved as "x".');

  await page.getByRole('link', { name: 'My Projects' }).click();
  await page.getByRole('link', { name: 'x', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved as "x".');
  await expect(page.locator('.canvas-wrapper canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Cube' }).click();
  await page.getByRole('button', { name: 'Save project' }).click();
  const secondResponse = page.waitForResponse((result) =>
    result.url().endsWith('/api/projects/project_11') && result.request().method() === 'PUT',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  const savedAgain = await (await secondResponse).json() as { design: { blocks: { rotation: typeof rotation }[] } };
  expect(savedAgain.design.blocks.slice(0, 4)).toEqual(saved.design.blocks);
  expect(pageErrors).toEqual([]);
});

test.describe('Loading a project with unsaved changes (browser, mock backend)', () => {
  async function openProjectFromMyProjects(page: Page, name: string) {
    await page.getByRole('link', { name: 'My Projects' }).click();
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }

  test('loading another project does not show a second warning', async ({ page }) => {
    await registerAndSignIn(page);
    await openProjectFromMyProjects(page, 'x');
    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');

    let confirmationCount = 0;
    page.on('dialog', async (dialog) => {
      confirmationCount += 1;
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Load project' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Rocket ship' }).click();
    await dialog.getByRole('button', { name: 'Open project' }).click();

    await expect(page).toHaveURL(/\/editor\/project_3$/);
    await expect(page.getByRole('heading', { name: 'Rocket ship', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Saved as "Rocket ship".');
    expect(confirmationCount).toBe(0);
  });

  test('loading the same project restores its saved design and status', async ({ page }) => {
    await registerAndSignIn(page);
    await openProjectFromMyProjects(page, 'x');
    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');

    let confirmationCount = 0;
    page.on('dialog', async (dialog) => {
      confirmationCount += 1;
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Load project' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^x/ }).click();
    await dialog.getByRole('button', { name: 'Open project' }).click();

    await expect(page).toHaveURL(/\/editor\/project_11$/);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'x', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Saved as "x".');
    expect(confirmationCount).toBe(0);
  });

  test('canceling the Load dialog keeps unsaved changes', async ({ page }) => {
    await registerAndSignIn(page);
    await openProjectFromMyProjects(page, 'x');
    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');

    await page.getByRole('button', { name: 'Load project' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Unsaved changes in the editor will be lost.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'x', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');
  });

  test('browser Forward asks before discarding changes after loading a project', async ({ page }) => {
    await registerAndSignIn(page);
    await openProjectFromMyProjects(page, 'x');
    await page.getByRole('button', { name: 'Load project' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Rocket ship' }).click();
    await dialog.getByRole('button', { name: 'Open project' }).click();
    await expect(page.getByRole('heading', { name: 'Rocket ship', exact: true })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'x', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');

    const warning = page.waitForEvent('dialog');
    await page.evaluate(() => history.forward());
    const confirmation = await warning;
    expect(confirmation.message()).toContain('unsaved changes');
    await confirmation.dismiss();

    await expect(page).toHaveURL(/\/editor\/project_11$/);
    await expect(page.getByRole('heading', { name: 'x', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');

    await page.getByRole('button', { name: 'Save project' }).click();
    const saveResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/projects/project_11') && response.request().method() === 'PUT',
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
    const savedProject = await (await saveResponse).json() as { design: { blocks: { type: string }[] } };
    expect(savedProject.design.blocks).toHaveLength(9);
    expect(savedProject.design.blocks[8].type).toBe('cube');
    await expect(page.getByRole('status')).toHaveText('Saved as "x".');

    await page.getByRole('button', { name: 'Cube' }).click();
    await expect(page.getByRole('status')).toHaveText('Unsaved changes.');
    const nextWarning = page.waitForEvent('dialog');
    await page.evaluate(() => history.forward());
    const nextConfirmation = await nextWarning;
    expect(nextConfirmation.message()).toContain('unsaved changes');
    await nextConfirmation.accept();
    await expect(page).toHaveURL(/\/editor\/project_3$/);
    await expect(page.getByRole('heading', { name: 'Rocket ship', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Saved as "Rocket ship".');
  });
});
