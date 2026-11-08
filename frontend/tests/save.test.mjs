import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

let vite;
let store;
let createProject;
let mockServer;

before(async () => {
  vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
  });
  ({ useDesignStore: store } = await vite.ssrLoadModule('/src/hooks/useDesignStore.ts'));
  ({ createProject } = await vite.ssrLoadModule('/src/services/projectApi.ts'));
  const { handlers } = await vite.ssrLoadModule('/src/mocks/handlers.ts');
  mockServer = setupServer(...handlers);
  mockServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  store.setState({ blocks: [], selectedBlockId: null, project: null });
  mockServer.resetHandlers();
});

after(async () => {
  mockServer?.close();
  await vite?.close();
});

test('editor state serializes shape properties and stores project metadata', () => {
  store.getState().addBlock('cube');
  const id = store.getState().selectedBlockId;
  store.getState().moveBlock(id, { x: 2, y: 3, z: -4 });
  store.getState().scaleBlock(id, 2);
  store.getState().updateColor('#abcdef');
  const design = store.getState().toJSON();
  assert.deepEqual(design, {
    version: 1,
    blocks: [{ id, type: 'cube', color: '#abcdef', position: { x: 2, y: 3, z: -4 }, scale: 2 }],
  });
  design.blocks[0].position.x = 100;
  assert.equal(store.getState().blocks[0].position.x, 2);
  store.getState().setProject({ id: 'project-id', name: 'Model', userId: 'owner' });
  assert.equal(store.getState().project.id, 'project-id');
  assert.equal(store.getState().project.name, 'Model');
});

test('createProject sends the token and design and preserves server errors', async () => {
  let received;
  mockServer.use(http.post('*/api/projects', async ({ request }) => {
    received = { authorization: request.headers.get('authorization'), body: await request.json() };
    return HttpResponse.json({ id: 'project-id', name: 'Model', difficulty: 'Brick', createdAt: '2026-01-01', updatedAt: '2026-01-01' }, { status: 201 });
  }));
  const design = { version: 1, blocks: [] };
  const project = await createProject('Model', design, 'test-token');
  assert.deepEqual(received, { authorization: 'Bearer test-token', body: { name: 'Model', design } });
  assert.equal(project.id, 'project-id');

  mockServer.use(http.post('*/api/projects', () =>
    HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Save failed.' } }, { status: 500 })
  ));
  await assert.rejects(createProject('Model', design, 'test-token'), { status: 500, message: 'Save failed.' });
});

test('MSW create handler requires authentication and accepts a registered user', async () => {
  const base = 'http://localhost:8080/api';
  const json = { 'Content-Type': 'application/json' };
  const design = { version: 1, blocks: [] };
  const unauthorized = await fetch(`${base}/projects`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'Model', design }) });
  assert.equal(unauthorized.status, 401);
  const registration = await fetch(`${base}/auth/register`, {
    method: 'POST', headers: json, body: JSON.stringify({ name: 'Tester', email: 'save-test@example.test', password: 'password' }),
  });
  assert.equal(registration.status, 201);
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: json, body: JSON.stringify({ email: 'save-test@example.test', password: 'password' }),
  });
  const { token } = await login.json();
  const saved = await createProject('Model', design, token);
  assert.equal(saved.name, 'Model');
  assert.ok(saved.id);
});
