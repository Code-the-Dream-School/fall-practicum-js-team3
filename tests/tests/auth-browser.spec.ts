import { test, expect, type Page } from '@playwright/test';

// A new email for every call, so tests never depend on each other
function uniqueEmail() {
  return `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

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

test.describe('Registration (browser, mock backend)', () => {
  test('a visitor can create an account and is sent to the login page', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(uniqueEmail());
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toHaveText('Account created. Please sign in.');
  });

  test('registering with an email that already exists shows an error', async ({ page }) => {
    const email = uniqueEmail();

    // First registration: succeeds and lands on the login page
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Back to the register page by clicking the link (no reload, the fake accounts live in memory)
    await page.getByRole('main').getByRole('link', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/register$/);

    // Second registration with the same email
    await page.getByLabel('Name').fill('Another User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('This email is already registered.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});

test.describe('Login and logout (browser, mock backend)', () => {
  // The fake accounts live in memory and start empty on every page load,
  // so each test creates its own account first and then works on the login page.
  async function registerAccount(page: Page, name: string, email: string, password: string) {
    await page.goto('/register');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/login$/);
  }

  async function signIn(page: Page, email: string, password: string) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }

  test('a registered user can log in and sees their name in the header', async ({ page }) => {
    const email = uniqueEmail();
    await registerAccount(page, 'Test User', email, 'password123');

    await signIn(page, email, 'password123');

    await expect(page).toHaveURL(/localhost:5173\/$/);
    await expect(page.getByText('Hello, Test User')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('an email with no account shows the same error', async ({ page }) => {
    await page.goto('/login');

    await signIn(page, uniqueEmail(), 'password123');

    await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logging out returns to the login page and closes the protected pages', async ({ page }) => {
    const email = uniqueEmail();
    await registerAccount(page, 'Test User', email, 'password123');
    await signIn(page, email, 'password123');
    await expect(page.getByText('Hello, Test User')).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    // The browser's Back button goes to the main page, which must send the visitor to login again
    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
  });
});