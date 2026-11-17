
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { makeDeleteProjectHandler } from '../controllers/projectController';
import { requireAuth } from '../middleware/requireAuth';
import { ApiError } from '../errors/ApiError';

const secret = 'project-delete-test-secret-with-more-than-32-characters';
const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = secret;

after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

const tokenFor = (sub = 'user-123') => jwt.sign({ sub }, secret);

const projectId = '507f1f77bcf86cd799439011';

interface DeleteResult {
  status: number;
  body?: unknown;
  owner?: unknown;
  deletedId?: unknown;
}

async function requestDelete(options: {
  authorization?: string;
  projectId?: string;
  deleteResult?: boolean;
}): Promise<DeleteResult> {
  // Mock Express request
  const req = {
    header: (name: string) =>
      name.toLowerCase() === 'authorization'
        ? options.authorization
        : undefined,
    params: { projectId: options.projectId ?? projectId },
  } as unknown as Request;

  // Store the response and values passed to the repository
  const result: DeleteResult = { status: 200 };

  // Mock Express response
  const res = {
    locals: {} as Record<string, unknown>,
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
    send() {
      return this;
    },
  } as unknown as Response;

  // Run authentication middleware
  let authenticated = false;

  requireAuth(req, res, (() => {
    authenticated = true;
  }) as NextFunction);

  if (!authenticated) return result;

  // Inject a fake repository function
  const handler = makeDeleteProjectHandler(async (owner, id) => {
    result.owner = owner;
    result.deletedId = id;
    return options.deleteResult ?? true;
  });

  // Run the DELETE controller
  await handler(req, res, ((error?: unknown) => {
    if (error instanceof ApiError) {
      result.status = error.statusCode;
      result.body = {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    } else if (error) {
      throw error;
    }
  }) as NextFunction);

  return result;
}

// TEST 1: Successful deletion
test('deletes a project owned by the authenticated user', async () => {
  const result = await requestDelete({
    authorization: `Bearer ${tokenFor()}`,
  });

  assert.equal(result.status, 204);
  assert.equal(result.owner, 'user-123');
  assert.equal(result.deletedId, projectId);
  assert.equal(result.body, undefined);
});

// TEST 2: Missing authentication
test('rejects deletion without a token', async () => {
  const result = await requestDelete({});

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, {
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required.',
    },
  });
});

// TEST 3: Invalid authentication
test('rejects deletion with an invalid token', async () => {
  const result = await requestDelete({
    authorization: 'Bearer invalid-token',
  });

  assert.equal(result.status, 401);
});

// TEST 4: Project not found
test('returns 404 when the project does not exist', async () => {
  const result = await requestDelete({
    authorization: `Bearer ${tokenFor()}`,
    deleteResult: false,
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    error: {
      code: 'PROJECT_NOT_FOUND',
      message: 'Project not found.',
    },
  });
});


test('uses the authenticated user ID when deleting a project', async () => {
  const result = await requestDelete({
    authorization: `Bearer ${tokenFor('user-456')}`,
  });

  assert.equal(result.status, 204);
  assert.equal(result.owner, 'user-456');
  assert.equal(result.deletedId, projectId);
});


test('returns 404 when attempting to delete another users project', async () => {
  const result = await requestDelete({
    authorization: `Bearer ${tokenFor('user-456')}`,
    deleteResult: false,
  });

  assert.equal(result.status, 404);
  assert.equal(result.owner, 'user-456');
  assert.equal(result.deletedId, projectId);

  assert.deepEqual(result.body, {
    error: {
      code: 'PROJECT_NOT_FOUND',
      message: 'Project not found.',
    },
  });
});


