import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { makeCreateProjectHandler, makeGetProjectHandler, makeUpdateProjectHandler } from '../controllers/projectController';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateCreateProjectBody,
  validateProjectId,
  type CreateProjectBody,
} from '../middleware/projectValidation';
import type { ProjectView } from '../repositories/projectRepository';
import app from '../app';

const secret = 'project-route-test-secret-with-more-than-32-characters';
const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = secret;

after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

const tokenFor = (sub = 'user-from-token') => jwt.sign({ sub }, secret);
const design = { version: 1, blocks: [] } as const;

interface RouteResult {
  status: number;
  body: unknown;
  owner?: unknown;
  input?: unknown;
  projectId?: unknown;
  getCalled?: boolean;
}

async function requestProject(options: {
  authorization?: string;
  body: unknown;
}): Promise<RouteResult> {
  const req = {
    header: (name: string) => name.toLowerCase() === 'authorization' ? options.authorization : undefined,
    body: options.body,
  } as unknown as Request<{}, {}, CreateProjectBody>;
  const result: RouteResult = { status: 200, body: undefined };
  const res = {
    locals: {} as Record<string, unknown>,
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = JSON.parse(JSON.stringify(body)) as unknown;
      return this;
    },
  } as unknown as Response;

  let authenticated = false;
  requireAuth(req, res, (() => { authenticated = true; }) as NextFunction);
  if (!authenticated) return result;

  let validated = false;
  validateCreateProjectBody(req, res, (() => { validated = true; }) as NextFunction);
  if (!validated) return result;

  const handler = makeCreateProjectHandler(async (owner, input) => {
    result.owner = owner;
    result.input = input;
    return {
      id: 'project-123',
      name: input.name,
      createdAt: new Date('2026-11-11T12:00:00.000Z'),
      updatedAt: new Date('2026-11-11T12:00:00.000Z'),
    };
  });
  await handler(req, res, (() => undefined) as NextFunction);
  return result;
}

const projectId = '665f1a2b3c4d5e6f78901234';
const projectView: ProjectView = {
  id: projectId,
  name: 'My design',
  createdAt: new Date('2026-11-11T12:00:00.000Z'),
  updatedAt: new Date('2026-11-12T12:00:00.000Z'),
  design: { version: 1, blocks: [] },
};

async function requestGetProject(options: {
  authorization?: string;
  id: string;
  storedOwner?: string;
  exists?: boolean;
}): Promise<RouteResult> {
  const req = {
    header: (name: string) => name.toLowerCase() === 'authorization' ? options.authorization : undefined,
    params: { id: options.id },
  } as unknown as Request<{ id: string }>;
  const result: RouteResult = { status: 200, body: undefined, getCalled: false };
  const res = {
    locals: {} as Record<string, unknown>,
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = JSON.parse(JSON.stringify(body)) as unknown;
      return this;
    },
  } as unknown as Response;

  let authenticated = false;
  requireAuth(req, res, (() => { authenticated = true; }) as NextFunction);
  if (!authenticated) return result;

  let validId = false;
  validateProjectId(req, res, (() => { validId = true; }) as NextFunction);
  if (!validId) return result;

  const handler = makeGetProjectHandler(async (owner, id) => {
    result.getCalled = true;
    result.owner = owner;
    result.projectId = id;
    if (owner !== (options.storedOwner ?? 'user-from-token') || options.exists === false) {
      return null;
    }
    return projectView;
  });
  await handler(req, res, (() => undefined) as NextFunction);
  return result;
}

test('creates a project and takes its owner from the JWT', async () => {
  const result = await requestProject({
    authorization: `Bearer ${tokenFor()}`,
    body: { name: '  My design  ', design, owner: 'attacker' },
  });

  assert.equal(result.status, 201);
  assert.equal(result.owner, 'user-from-token');
  assert.deepEqual(result.input, { name: 'My design', design });
  assert.deepEqual(result.body, {
    id: 'project-123',
    name: 'My design',
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
  });
});

test('rejects a missing project name with the standard error shape', async () => {
  const result = await requestProject({
    authorization: `Bearer ${tokenFor()}`,
    body: { design },
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'name must be 1 to 100 characters.' },
  });
});

test('rejects a design that fails the shared design validator', async () => {
  const result = await requestProject({
    authorization: `Bearer ${tokenFor()}`,
    body: { name: 'My design', design: { version: 99, blocks: [] } },
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'design.version must be 1.' },
  });
});

test('rejects project creation without a token', async () => {
  const result = await requestProject({ body: { name: 'My design', design } });

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, {
    error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
  });
});

test('returns the full project when the authenticated user owns it', async () => {
  const result = await requestGetProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
  });

  assert.equal(result.status, 200);
  assert.equal(result.owner, 'user-from-token');
  assert.equal(result.projectId, projectId);
  assert.deepEqual(result.body, {
    id: projectId,
    name: 'My design',
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-12T12:00:00.000Z',
    design,
  });
});

test('returns the same not-found response when another user owns the project', async () => {
  const result = await requestGetProject({
    authorization: `Bearer ${tokenFor('different-user')}`,
    id: projectId,
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
  });
});

test('returns not found when the project does not exist', async () => {
  const result = await requestGetProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    exists: false,
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
  });
});

test('rejects a malformed project id with 400 before querying the repository', async () => {
  const result = await requestGetProject({
    authorization: `Bearer ${tokenFor()}`,
    id: 'not-an-object-id',
  });

  assert.equal(result.status, 400);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'id must be a valid project id.' },
  });
});

test('rejects a request without a token', async () => {
  const result = await requestGetProject({ id: projectId });

  assert.equal(result.status, 401);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
  });
});

// ---- PUT /api/projects/:id ----
async function requestUpdateProject(options: {
  authorization?: string;
  id: string;
  body: unknown;
  storedOwner?: string;
  exists?: boolean;
}): Promise<RouteResult> {
  const req = {
    header: (name: string) => name.toLowerCase() === 'authorization' ? options.authorization : undefined,
    params: { id: options.id },
    body: options.body,
  } as unknown as Request<{ id: string }, {}, CreateProjectBody>;
  const result: RouteResult = { status: 200, body: undefined, getCalled: false };
  const res = {
    locals: {} as Record<string, unknown>,
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = JSON.parse(JSON.stringify(body)) as unknown;
      return this;
    },
  } as unknown as Response;

  let authenticated = false;
  requireAuth(req, res, (() => { authenticated = true; }) as NextFunction);
  if (!authenticated) return result;

  let validId = false;
  validateProjectId(req, res, (() => { validId = true; }) as NextFunction);
  if (!validId) return result;

  let validBody = false;
  validateCreateProjectBody(req, res, (() => { validBody = true; }) as NextFunction);
  if (!validBody) return result;

  const handler = makeUpdateProjectHandler(async (owner, id, changes) => {
    result.getCalled = true;
    result.owner = owner;
    result.projectId = id;
    result.input = changes;
    if (owner !== (options.storedOwner ?? 'user-from-token') || options.exists === false) {
      return null;
    }
    return {
      ...projectView,
      name: changes.name,
      design: changes.design,
      updatedAt: new Date('2026-11-13T12:00:00.000Z'),
    };
  });
  await handler(req, res, (() => undefined) as NextFunction);
  return result;
}

test('PUT updates the project, trims the name and takes the owner from the JWT', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: '  Renamed  ', design, owner: 'attacker' },
  });

  assert.equal(result.status, 200);
  assert.equal(result.owner, 'user-from-token');
  assert.equal(result.projectId, projectId);
  assert.deepEqual(result.input, { name: 'Renamed', design });
  assert.deepEqual(result.body, {
    id: projectId,
    name: 'Renamed',
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-13T12:00:00.000Z',
    design,
  });
});

test('PUT returns 404 when another user owns the project', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor('different-user')}`,
    id: projectId,
    body: { name: 'Renamed', design },
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
  });
});

test('PUT returns 404 when the project does not exist', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'Renamed', design },
    exists: false,
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
  });
});

test('PUT rejects an invalid design before reaching the database', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'Renamed', design: { version: 99, blocks: [] } },
  });

  assert.equal(result.status, 400);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'design.version must be 1.' },
  });
});

test('PUT rejects a missing design', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'Renamed' },
  });

  assert.equal(result.status, 400);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'design must be an object.' },
  });
});

test('PUT rejects a name with only spaces', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: '   ', design },
  });

  assert.equal(result.status, 400);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'name must be 1 to 100 characters.' },
  });
});

test('PUT rejects a malformed project id before reaching the database', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: 'not-an-object-id',
    body: { name: 'Renamed', design },
  });

  assert.equal(result.status, 400);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'VALIDATION_ERROR', message: 'id must be a valid project id.' },
  });
});

test('PUT rejects a request without a token', async () => {
  const result = await requestUpdateProject({
    id: projectId,
    body: { name: 'Renamed', design },
  });

  assert.equal(result.status, 401);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
  });
});

// Too large (413): the body parser in app.ts rejects the request before any route runs,
// so this test starts the real app on a free port and sends a body over 1 MB.
test('PUT rejects a body over 1 MB with 413 in the standard error format', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenFor()}`,
      },
      body: JSON.stringify({ name: 'Big', design, padding: 'x'.repeat(1024 * 1024 + 10) }),
    });

    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), {
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' },
    });
  } finally {
    server.close();
    server.closeAllConnections();
  }
});

test('PUT rejects more than 500 blocks with 409 SHAPE_LIMIT_REACHED', async () => {
  const blocks = Array.from({ length: 501 }, (_, i) => ({
    id: i + 1,
    type: 'cube',
    color: '#FF0000',
    position: { x: 0, y: 0, z: 0 },
    scale: 1,
  }));
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'Renamed', design: { version: 1, blocks } },
  });

  assert.equal(result.status, 409);
  assert.equal(result.getCalled, false);
  assert.deepEqual(result.body, {
    error: { code: 'SHAPE_LIMIT_REACHED', message: 'A project holds at most 500 blocks.' },
  });
});

// ---- PUT fills in a missing "rotation" ----
const cubeWithoutRotation = {
  id: 1,
  type: 'cube',
  color: '#0ea5e9',
  position: { x: 0, y: 0, z: 0 },
  scale: 1,
};

test('PUT gives a block without rotation the default { x: 0, y: 0, z: 0 }', async () => {
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'No rotation', design: { version: 1, blocks: [cubeWithoutRotation] } },
  });

  const expectedBlocks = [{ ...cubeWithoutRotation, rotation: { x: 0, y: 0, z: 0 } }];
  assert.equal(result.status, 200);
  // What the repository receives (this is what is saved in MongoDB).
  assert.deepEqual((result.input as CreateProjectBody).design.blocks, expectedBlocks);
  // What the client gets back.
  assert.deepEqual((result.body as { design: unknown }).design, { version: 1, blocks: expectedBlocks });
});

test('PUT keeps the rotation of a block that already has one', async () => {
  const rotated = { ...cubeWithoutRotation, rotation: { x: 1, y: 0.5, z: 0 } };
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'With rotation', design: { version: 1, blocks: [rotated] } },
  });

  assert.equal(result.status, 200);
  assert.deepEqual((result.input as CreateProjectBody).design.blocks, [rotated]);
});

test('PUT fills in rotation only for the blocks that miss it', async () => {
  const rotated = { ...cubeWithoutRotation, id: 2, rotation: { x: 0, y: 0.8, z: 0 } };
  const result = await requestUpdateProject({
    authorization: `Bearer ${tokenFor()}`,
    id: projectId,
    body: { name: 'Mixed', design: { version: 1, blocks: [cubeWithoutRotation, rotated] } },
  });

  assert.equal(result.status, 200);
  assert.deepEqual((result.input as CreateProjectBody).design.blocks, [
    { ...cubeWithoutRotation, rotation: { x: 0, y: 0, z: 0 } },
    rotated,
  ]);
});