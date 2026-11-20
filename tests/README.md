# BlockCAD tests

Automated tests for BlockCAD, written with [Playwright](https://playwright.dev) and TypeScript. There are two kinds:

- **Browser tests** (34 tests in 3 files). Playwright opens the real app in Chromium and acts like a user: it opens pages, types, clicks and checks what is on the screen. They use a fake backend (MSW), so you do **not** need the real backend, a database or a `.env` file.
- **API tests for authentication** (16 tests in 2 files). Playwright sends real requests to **your own local backend** and checks the answers. No browser window opens. They need the backend, your own database and a test user (see "API tests (authentication)" below).

## Before you start

- **Node.js and npm.** The team uses Node.js v24. The project does not state a required version.
- **Git.**
- **Free disk space for Chromium.** `npx playwright install chromium` needs about 700 MB on disk (measured on Windows with the current Playwright version, so it can differ a little on other systems). It is installed once, outside the project folder.
- **Windows only:** run `git config core.longpaths true` once, because the Jira branch names are very long.

## Quick start: run the browser tests

Start in the repository root (the folder that contains `frontend/`, `backend/` and `tests/`). Stop `npm run dev` first if it is running, because the tests start their own copy of the frontend on port 5173.

```bash
cd frontend
npm install
cd ../tests
npm install
npx playwright install chromium
npm run test:browser
```

Expected result: `34 passed`.

### Checkpoints for the browser tests

- [ ] `node --version` prints a version.
- [ ] Nothing else uses port 5173 (stop `npm run dev` if it is running).
- [ ] `npm install` finished without errors in `frontend/` and in `tests/`.
- [ ] `npx playwright install chromium` finished without errors.
- [ ] `npm run test:browser` prints `34 passed`.

## Running the browser tests

Run all commands in the `tests` folder. Stop `npm run dev` first, because the tests start their own copy of the frontend.

Run all 34 tests (no window opens):

```bash
npm run test:browser
```

Run one file:

```bash
npm run test:browser -- auth-browser
npm run test:browser -- projects-browser
npm run test:browser -- editor-browser
```

Run a group of tests, or one test, by name. `-g` runs only the tests whose name contains that text. Capital letters do not matter, and `|` combines several names:

```bash
npm run test:browser -- -g "My Projects search"
npm run test:browser -- -g "Saving a project|Save dialog|Editor after logout"
npm run test:browser -- -g "typing quickly"
```

The group names are "Protected pages", "Registration", "Login and logout" and "Form validation" (login and registration), "My Projects page states", "My Projects search" and "Saving a project" (My Projects), and "Save dialog" and "Editor after logout" (editor).

Watch a test in a visible Chromium window. `--headed` opens the window, and `--workers=1` runs one test at a time so you can follow it:

```bash
npm run test:browser -- --headed --workers=1 -g "typing quickly"
```

Debug a test step by step. `--debug` opens the Playwright Inspector. Press **F10** to run the next step and **F8** to run to the end of the test:

```bash
npm run test:browser -- --debug --workers=1 -g "typing quickly"
```

Open the interactive UI with every test and a timeline:

```bash
npm run test:browser -- --ui
```

After a failed test, Playwright keeps a trace. Open it with `npx playwright show-trace <path to trace.zip>`. The path is printed in the error message.

## What the browser tests check

### Login and registration (`auth-browser.spec.ts`, 10 tests)

- A visitor on `/` is sent to `/login`.
- A visitor on `/projects` is sent to `/login`.
- A visitor can create an account and sees "Account created. Please sign in."
- An email that already exists shows "This email is already registered."
- A registered user can log in and sees their name in the header.
- An unknown email shows "Email or password is incorrect."
- Log out returns to `/login`, and the Back button does not open the protected page.
- A logged-in user can open My Projects from the header.
- The login form asks for the email and the password when they are empty.
- The register form shows the validation errors and stays on the page.

Not covered, because the fake backend cannot do it: a wrong password for an existing account (the mock accepts any password for a registered email), and staying logged in after a page reload (the mock forgets its accounts on reload).

### My Projects and saving (`projects-browser.spec.ts`, 18 tests)

- **Page states** (group "My Projects page states", 4 tests): loading, then the 12 sample projects; an empty list ("No projects yet." and a "Create your first project" link); a server error (message and Try again button, and Try again loads the projects); an expired session (401, "Your session has expired." and a "Sign in again" link).
- **Search** (group "My Projects search", 13 tests): letter case (`rob`, `ROBOT`, `Rob`), spaces around the text, a part from the middle of a name, special characters `&` and `'`, Cyrillic text in lower and upper case, no results (`No projects match "zzz".`), Clear search, deleting the text with Backspace, and the debounce (typing quickly sends only one request).
- **Saving** (group "Saving a project", 1 test): a project saved in the editor appears first in My Projects.

### Save dialog and logout (`editor-browser.spec.ts`, 6 tests)

- **Save dialog** (group "Save dialog", 5 tests): an empty name shows "Please enter a project name."; a name of 101 characters shows "Project name must be at most 100 characters."; Cancel closes the dialog and saves nothing; Escape closes the dialog; when the server fails, a message appears in the dialog, and saving again works after the problem is gone.
- **Logout** (group "Editor after logout", 1 test): after logging out and signing in again, the editor is empty and "Unsaved changes." is gone, so the design store is reset on logout.

## How the browser tests work

- The frontend runs with `VITE_USE_MOCKS=true`. This turns on MSW (Mock Service Worker), a fake backend inside the browser. Playwright starts the frontend automatically (`webServer` in `playwright.browser.config.ts`) on port 5173.
- The browser config runs only files whose name ends with `-browser.spec.ts`. The browser tests are in `tests/tests/`: `auth-browser.spec.ts`, `projects-browser.spec.ts` and `editor-browser.spec.ts`.
- The fake accounts and projects live in memory and are emptied on every page load or reload. So each test registers its own account first (`registerAndSignIn`) and then only clicks links. It never reloads the page or opens a URL directly after signing in. Because of that, the tests do not depend on each other and can run in any order.
- Playwright's own request interception (`page.route`) does not see requests that the mock service worker answers. So the error, empty and expired-session answers are faked inside the page by replacing `window.fetch`. The replacement only changes requests whose URL contains `/api/projects`.
- The search debounce is tested by counting the requests (`startCountingProjectsRequests` and `projectsRequestCount` in `projects-browser.spec.ts`), not by waiting a fixed time.
- The 3D shapes are drawn on a canvas (WebGL), which Playwright cannot read. So the tests check the page around it: the sidebar, the status text and the dialogs.

### Shared helpers (`browser-helpers.ts`)

The browser test files import these from `tests/tests/browser-helpers.ts`:

- `uniqueEmail()`: a new email for every call, so tests never depend on each other.
- `registerAccount(page, email)`: opens the register page and creates an account.
- `signIn(page, email)`: signs in and waits for the greeting.
- `registerAndSignIn(page)`: creates an account, signs in and returns the email.
- `fakeProjectsAnswer(page, status, body)`: makes the projects requests answer with the given status and body.
- `restoreProjectsAnswer(page)`: puts the normal mock answer back.

The file also exports the constants `TEST_NAME`, `TEST_PASSWORD` and `GREETING`. Playwright does not run `browser-helpers.ts` as a test, because the config runs only files that end with `-browser.spec.ts`.

## API tests (authentication)

These 16 tests cover register, login, logout and the current user. They send real HTTP requests to **your own local backend** and check the answers. No browser window opens. They are in `tests/tests/auth-api.spec.ts` (9 tests) and `tests/tests/auth-register-api.spec.ts` (7 tests).

The tests never use a shared server or anyone else's database. You need:

- The backend running on your computer on port **8080**. The tests call `http://localhost:8080/api`.
- Your own Postgres database. A free [Neon](https://neon.tech) account is enough.
- A MongoDB database that the backend can connect to. The authentication tests do not use it, but the backend does not start without it.
- A test user in your Postgres database (step 3).

Use two terminals. **Terminal 1** runs the backend and stays open. **Terminal 2** is used for the `curl` command and for running the tests.

### 1. Backend settings (once)

Copy `backend/.env.example` to `backend/.env` and fill in the values:

- `POSTGRES_URI`: your Neon connection string.
- `MONGO_URI`: the connection to your MongoDB. For a MongoDB running on your computer the example value `mongodb://localhost:27017/blockcad` works. You can also use the connection string of a free MongoDB Atlas cluster.
- `JWT_SECRET`: any random text of at least 32 characters.
- `PORT=8080`: the example file says 5000, but the API tests call port 8080, so change it.
- `CLIENT_ORIGIN=http://localhost:5173`

`.env` is private and ignored by Git. **Never commit it, and never paste real values (connection strings, passwords, secrets) into a PR, an issue or Slack.**

### 2. Start the backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

Wait for `MongoDB connected` and then `Server running on http://localhost:8080`, and keep this terminal open. The server starts listening only after MongoDB is connected. If MongoDB is not reachable, the terminal prints `MongoDB connection error: connect ECONNREFUSED ...:27017` and the server does not start (see Troubleshooting).

### 3. Create the test user (once)

The login, logout and current-user tests use a fixed user. Create it through the real register endpoint in Terminal 2, after the backend has started:

```bash
curl -s -w ' <- status %{http_code}\n' -X POST http://localhost:8080/api/auth/register -H 'Content-Type: application/json' -d '{"name":"test-user","email":"test-user@example.com","password":"TestPassword123"}'
```

You should see the new user and `status 201`. If you see `409` (`USERNAME_ALREADY_TAKEN`), the user already exists, which is fine.

Git Bash on Windows: use single quotes as shown. Double quotes together with `!` in a password cause "event not found". That is why the test password has no `!`.

### 4. Install the tests (once)

In Terminal 2, in the `tests` folder. The browser tests and the API tests share the same `tests/` folder and the same Chromium. If you already ran the two commands below for the browser tests (quick start), do not run them again.

```bash
npm install
npx playwright install chromium
```

### 5. Run the API tests

The backend from step 2 must be running in Terminal 1. Run all commands in the `tests` folder (Terminal 2).

```bash
npx playwright test
```

Expected result: `16 passed`.

This command runs only the API tests. The browser tests are a separate run: `npm run test:browser` (34 tests, no backend needed).

Optional, only when you need them:

```bash
npx playwright test auth-register-api            # one file
npx playwright test -g "without a body"          # tests whose name contains the text
npx playwright test --workers=1                  # one test at a time, easier to debug
npx playwright show-report                       # open the HTML report (Ctrl+C to stop)
```

### Checkpoints for the API tests

- [ ] `backend/.env` exists with your own `POSTGRES_URI` and `MONGO_URI`, a `JWT_SECRET` of at least 32 characters, `PORT=8080` and `CLIENT_ORIGIN`. It is not committed.
- [ ] Your MongoDB is running or reachable.
- [ ] Terminal 1: `npm run dev` in `backend/` prints `MongoDB connected` and `Server running on http://localhost:8080`, and the terminal stays open.
- [ ] Terminal 2: the `curl` command returns `status 201` (or `409` if the test user already exists).
- [ ] Terminal 2: `npx playwright test` prints `16 passed`.


### What the API tests check

- **Register** (`POST /api/auth/register`, 7 tests): success 201 without the password in the answer; a duplicate email gives 409 `EMAIL_ALREADY_REGISTERED`; a duplicate name gives 409 `USERNAME_ALREADY_TAKEN`; an invalid email gives 422; a too short password gives 422; no body gives 400 `INVALID_REQUEST`; a newly registered user can log in.
- **Login** (`POST /api/auth/login`, 4 tests): success 200 with a token and the user, without the password hash; an unknown email gives 401 `INVALID_CREDENTIALS`; a wrong password gives 401 `INVALID_CREDENTIALS`; no password gives 422 `VALIDATION_ERROR`.
- **Logout** (`POST /api/auth/logout`, 2 tests): a valid token gives 204; no token gives 401 `UNAUTHENTICATED`.
- **Current user** (`GET /api/auth/user`, 3 tests): a valid token gives 200; no token gives 401; an invalid token gives 401.

Good to know about the backend:

- The backend checks the **name before the email**. If both are already used, the answer is `USERNAME_ALREADY_TAKEN`. So each duplicate test duplicates only one field.
- Errors have the form `{ "error": { "code": "...", "message": "..." } }`.
- Not covered yet: a name longer than 50 characters, a password longer than 72 bytes, and a missing name or email on register.

### Cleaning up test data

Every full run of the API tests adds a few users named `pw-...` to your Postgres database. You can delete them whenever you like. This does not delete `test-user`.

1. Open the Neon website and the project whose connection string you put in `POSTGRES_URI`.
2. Open **SQL Editor** in the left menu.
3. Look at the rows first:

   ```sql
   SELECT username FROM users WHERE username LIKE 'pw-%';
   ```

4. If the list looks right, delete them:

   ```sql
   DELETE FROM users WHERE username LIKE 'pw-%';
   ```

## Writing a new test

The file name decides which kind of test it is:

- A file ending with `-browser.spec.ts` is a browser test. It runs with `npm run test:browser`.
- Any other `*.spec.ts` file in `tests/tests/` is an API test. It runs with `npx playwright test`. Name it like the existing ones, for example `projects-api.spec.ts`.

A browser test saved without `-browser` in its name would run with the API tests and fail, so check the name first.

### A new browser test

1. Put it in the file for that part of the app, or make a new file that ends with `-browser.spec.ts`. Playwright picks it up automatically.
2. Import the shared helpers: `import { registerAndSignIn } from './browser-helpers';`
3. Register a new account at the start of the test with `await registerAndSignIn(page);`
4. Find things like a user would: `getByRole`, `getByLabel`, `getByText`. Avoid CSS selectors. Some texts appear more than once on a page (for example "Create account" is a link, a heading and a button), so include the role.
5. Do not use `sleep` or `waitForTimeout`. Wait for something the user can see, for example `await expect(...).toBeVisible()`.
6. Give the test a name that says what is checked and what is expected.
7. Check that your test can fail: change one expected text, run the test, see it fail, then undo the change. A test that cannot fail is not useful.

### A new API test

1. Use the `request` fixture and keep the test independent from the others.
2. For a new user, create a unique name and email (see `newUser()` in `auth-register-api.spec.ts`).
3. For an endpoint that needs a login, log in first and then send ``headers: { Authorization: `Bearer ${token}` }``.
4. Name the test after the result, for example `register with an invalid email returns 422 VALIDATION_ERROR`.
5. The spec files start with `const API_URL = 'http://localhost:8080/api'`.

## Troubleshooting

Browser tests:

- `Port 5173 is already in use`: stop `npm run dev` (or any other app on 5173) and run the tests again.
- `Executable doesn't exist` or browser not found: run `npx playwright install chromium`.
- A test passes alone but fails with the others: check that it registers its own account and does not use data from another test.
- `No tests found` with `-g`: the text does not match a test name. Check the spelling and the quotes.
- The test is too fast to follow: use `--headed --workers=1`, or `--debug`.

API tests:

- `ECONNREFUSED` or connection errors from the tests: the backend is not running on port 8080. Check Terminal 1, and check that `backend/.env` has `PORT=8080` (the example file says 5000).
- Terminal 1 prints `MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017` and the server does not start: your `MONGO_URI` points to a MongoDB on your own computer, and none is running. Start your local MongoDB, or put the connection string of your MongoDB Atlas cluster in `MONGO_URI`.
- Login, logout or current-user tests fail with 401: the test user from step 3 is missing.
- Status 429: too many requests (rate limit). Wait a few minutes and run again.
- Status 500 `INTERNAL_ERROR` from the backend: `backend/.env` is missing or wrong (database connection or `JWT_SECRET`).
- `npx` asks `Need to install the following packages: playwright` and `Ok to proceed? (y)`: you are in the wrong folder, where Playwright is not installed. Answer `n` and run `cd tests` first.
- The report shows old results: you ran with `--reporter=line`. Run `npx playwright test` and then `npx playwright show-report`.
- `Filename too long` on Windows: run `git config core.longpaths true`.