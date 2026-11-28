import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { makeCreateProjectHandler, makeGetProjectHandler } from '../controllers/projectController';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateCreateProjectBody,
  validateProjectId,
  type CreateProjectBody,
} from '../middleware/projectValidation';
import type { ProjectView } from '../repositories/projectRepository';
import { createProject, getProject, updateProject } from '../repositories/projectRepository';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

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

const missingRotation = { id: 1, type: 'cube', color: '#ff0000', position: { x: 0, y: 0, z: 0 }, scale: 1 };
const rotatedBlock = {
  id: 2, type: 'sphere', color: '#00ff00', position: { x: 1, y: 0, z: 0 }, scale: 1,
  rotation: { x: 0.2, y: -0.5, z: 1 },
};
const defaultedBlock = { ...missingRotation, rotation: { x: 0, y: 0, z: 0 } };

for (const [label, blocks, expectedBlocks] of [
  ['missing', [missingRotation], [defaultedBlock]],
  ['present', [rotatedBlock], [rotatedBlock]],
  ['mixed', [missingRotation, rotatedBlock], [defaultedBlock, rotatedBlock]],
] as const) {
  test(`create, update and load preserve ${label} rotations`, async (t) => {
    const id = new mongoose.Types.ObjectId(projectId);
    const input = { version: 1, blocks };
    const expected = { version: 1, blocks: expectedBlocks };
    const now = new Date();
    const record = { _id: id, owner: 'user-from-token', name: 'Rotation test', design: input, createdAt: now, updatedAt: now };

    const insert = t.mock.method(Project.collection, 'insertOne', async (document: { _id: mongoose.Types.ObjectId; design: unknown }) => {
      assert.deepEqual(document.design, expected);
      return { acknowledged: true, insertedId: document._id };
    });
    await createProject('user-from-token', { name: record.name, design: input });
    assert.equal(insert.mock.callCount(), 1);

    const update = t.mock.method(Project.collection, 'findOneAndUpdate', async (_filter: unknown, changes: { $set?: { design?: unknown } }) => {
      assert.deepEqual(changes.$set?.design, expected);
      return { ...record, design: expected };
    });
    const updated = await updateProject('user-from-token', projectId, { name: record.name, design: input });
    assert.equal(update.mock.callCount(), 1);
    assert.deepEqual(updated?.design, expected);

    t.mock.method(Project.collection, 'findOne', async () => record);
    const loaded = await getProject('user-from-token', projectId);
    assert.deepEqual(loaded?.design, expected);
  });
}

test('create and update reject invalid supplied rotations', async () => {
  for (const rotation of [null, { x: 1, y: 2 }]) {
    const invalidDesign = { version: 1, blocks: [{ ...missingRotation, rotation }] };
    const input = { name: 'Rotation test', design: invalidDesign };
    await assert.rejects(createProject('user-from-token', input), { code: 'VALIDATION_ERROR' });
    await assert.rejects(updateProject('user-from-token', projectId, input), { code: 'VALIDATION_ERROR' });
  }
});
