import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { makeCreateProjectHandler } from '../controllers/projectController';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateCreateProjectBody,
  type CreateProjectBody,
} from '../middleware/projectValidation';

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

test('rejects a request without a token', async () => {
  const result = await requestProject({ body: { name: 'My design', design } });

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, {
    error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
  });
});
