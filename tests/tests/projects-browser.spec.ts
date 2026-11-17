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
// so each test creates its own account, signs in, and then only clicks links (no page.goto).
async function registerAndSignIn(page: Page) {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.getByLabel('Name').fill(TEST_NAME);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(GREETING)).toBeVisible();
}

// Opens My Projects by clicking the header link (a reload would empty the fake accounts)
async function openMyProjects(page: Page) {
  await page.getByRole('link', { name: 'My Projects' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'My Projects' })).toBeVisible();
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

test.describe('My Projects page states (browser, mock backend)', () => {
  test('shows a loading message and then the 12 sample projects, newest first', async ({ page }) => {
    await registerAndSignIn(page);
    await openMyProjects(page);

    // The mock waits 600 ms, so the loading message is visible first
    await expect(page.getByText('Loading your projects...')).toBeVisible();

    const projects = page.getByRole('main').getByRole('listitem');
    await expect(projects).toHaveCount(12);
    await expect(page.getByText('Loading your projects...')).toBeHidden();
    await expect(projects.first().getByRole('link')).toHaveText('x');
    await expect(projects.last().getByRole('link')).toHaveText('Super robot arm');
  });

  test('an empty list shows "No projects yet." and a link to create the first project', async ({ page }) => {
    await registerAndSignIn(page);
    await fakeProjectsAnswer(page, 200, { projects: [] });
    await openMyProjects(page);

    await expect(page.getByText('No projects yet.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create your first project' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0);
  });

  test('a server error shows a message with Try again, and Try again loads the list', async ({ page }) => {
    await registerAndSignIn(page);
    await fakeProjectsAnswer(page, 500, { error: { code: 'SERVER_ERROR', message: 'Server error' } });
    await openMyProjects(page);

    await expect(page.getByRole('alert')).toContainText('Could not load your projects. Please try again.');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0);

    // The problem is gone: Try again loads the normal list
    await restoreProjectsAnswer(page);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(12);
    await expect(page.getByRole('alert')).toBeHidden();
  });

  test('an expired session shows a message with a Sign in again link', async ({ page }) => {
    await registerAndSignIn(page);
    await fakeProjectsAnswer(page, 401, { error: { code: 'UNAUTHORIZED', message: 'Session expired' } });
    await openMyProjects(page);

    await expect(page.getByText('Your session has expired.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in again' })).toHaveAttribute('href', '/login');
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0);
  });
});

// ---------- Search ----------

// The 5 projects whose names contain "rob", in the order the mock server returns them
const ROBOT_PROJECTS = ['Robot 2', 'Robot', 'ROBOT PARTY', 'Robot dog', 'Super robot arm'];

// Signs in, opens My Projects and waits until all 12 sample projects are on the page
async function openMyProjectsWithFullList(page: Page) {
  await registerAndSignIn(page);
  await openMyProjects(page);
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(12);
}

function projectLinks(page: Page) {
  return page.getByRole('main').getByRole('listitem').getByRole('link');
}

function searchBox(page: Page) {
  return page.getByLabel('Search projects');
}

// Counts the requests for projects, so a test can check how many were sent while typing
async function startCountingProjectsRequests(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __projectsRequests?: number };
    w.__projectsRequests = 0;
    const realFetch = window.fetch.bind(window);

    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/projects')) w.__projectsRequests = (w.__projectsRequests ?? 0) + 1;
      return realFetch(input, init);
    };
  });
}

async function projectsRequestCount(page: Page) {
  return page.evaluate(() => (window as unknown as { __projectsRequests?: number }).__projectsRequests ?? 0);
}

test.describe('My Projects search (browser, mock backend)', () => {
  // Small letters, capital letters and a mix all find the same 5 projects
  for (const term of ['rob', 'ROBOT', 'Rob']) {
    test(`searching "${term}" finds the 5 robot projects`, async ({ page }) => {
      await openMyProjectsWithFullList(page);

      await searchBox(page).fill(term);

      await expect(projectLinks(page)).toHaveText(ROBOT_PROJECTS);
    });
  }

  test('spaces around the text are ignored', async ({ page }) => {
    await openMyProjectsWithFullList(page);

    await searchBox(page).fill('  rob  ');

    await expect(projectLinks(page)).toHaveText(ROBOT_PROJECTS);
  });

  test('the search matches a word in the middle of a name', async ({ page }) => {
    await openMyProjectsWithFullList(page);

    await searchBox(page).fill('arm');

    await expect(projectLinks(page)).toHaveText(['Super robot arm']);
  });

  // Special characters: they must not break the search
  for (const term of ['&', "'"]) {
    test(`searching the special character ${term} finds "Tom & Jerry's house" without an error`, async ({ page }) => {
      await openMyProjectsWithFullList(page);

      await searchBox(page).fill(term);

      await expect(projectLinks(page)).toHaveText(["Tom & Jerry's house"]);
      await expect(page.getByRole('alert')).toBeHidden();
    });
  }

  // Cyrillic letters, small and capital
  for (const term of ['будинок', 'БУДИНОК']) {
    test(`searching the Cyrillic word ${term} finds "Мій перший будинок"`, async ({ page }) => {
      await openMyProjectsWithFullList(page);

      await searchBox(page).fill(term);

      await expect(projectLinks(page)).toHaveText(['Мій перший будинок']);
    });
  }

  test('a search with no matches shows "No projects match", not the empty-list message', async ({ page }) => {
    await openMyProjectsWithFullList(page);

    await searchBox(page).fill('zzz');

    await expect(page.getByText('No projects match "zzz".')).toBeVisible();
    await expect(page.getByText('No projects yet.')).toHaveCount(0);
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0);
  });

  test('Clear search empties the box and brings back all 12 projects', async ({ page }) => {
    await openMyProjectsWithFullList(page);
    await searchBox(page).fill('zzz');
    await expect(page.getByText('No projects match "zzz".')).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();

    await expect(searchBox(page)).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Clear search' })).toBeHidden();
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(12);
  });

  test('deleting the typed text with Backspace brings back all 12 projects', async ({ page }) => {
    await openMyProjectsWithFullList(page);
    await searchBox(page).fill('rob');
    await expect(projectLinks(page)).toHaveText(ROBOT_PROJECTS);

    await searchBox(page).press('Backspace');
    await searchBox(page).press('Backspace');
    await searchBox(page).press('Backspace');

    await expect(searchBox(page)).toHaveValue('');
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(12);
  });

  test('typing quickly sends only one search request (debounce)', async ({ page }) => {
    await openMyProjectsWithFullList(page);
    await startCountingProjectsRequests(page);

    // 50 ms between the letters is much shorter than the 300 ms the page waits
    await searchBox(page).pressSequentially('rob', { delay: 50 });
    await expect(projectLinks(page)).toHaveText(ROBOT_PROJECTS);

    // One request for "rob", not one for "r", "ro" and "rob"
    expect(await projectsRequestCount(page)).toBe(1);
  });
});