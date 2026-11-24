
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { makeGetProjectsHandler } from '../controllers/projectController';
import { requireAuth } from '../middleware/requireAuth';
import { ApiError } from '../errors/ApiError';

const secret = 'project-get-test-secret-with-more-than-32-characters';
const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = secret;

after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

const tokenFor = (sub = 'user-123') => jwt.sign({ sub }, secret);

// Mocks.
const sampleProjects = [
  {
    id: 'project-1',
    name: 'My House',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  },
  {
    id: 'project-2',
    name: 'Garden Design',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-04'),
  },
];

interface GetResult {
  status: number;
  body?: unknown;
  owner?: unknown;
  search?: string;
}

async function requestGet(options: {
  authorization?: string;
  search?: unknown;
  projects?: typeof sampleProjects;
}): Promise<GetResult> {
  const req = {
    header: (name: string) =>
      name.toLowerCase() === 'authorization'
        ? options.authorization
        : undefined,
    query: options.search === undefined ? {} : { search: options.search },
  } as unknown as Request;

  const result: GetResult = { status: 200 };

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
  } as unknown as Response;

  let authenticated = false;

  requireAuth(
    req,
    res,
    ((error?: unknown) => {
      if (error) throw error;
      authenticated = true;
    }) as NextFunction,
  );

  if (!authenticated) return result;

  const handler = makeGetProjectsHandler(async (owner, listOptions) => {
    result.owner = owner;
    result.search = listOptions?.search;

    const projects = options.projects ?? sampleProjects;

    return {
      projects,
      pagination: {
        total: projects.length,
        limit: 20,
        offset: 0,
      },
    };
  });

  await handler(
    req,
    res,
    ((error?: unknown) => {
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
    }) as NextFunction,
  );

  return result;
}

// TEST 1: Get projects successfully
test('returns the authenticated user projects', async () => {
  const result = await requestGet({
    authorization: `Bearer ${tokenFor()}`,
  });

  assert.equal(result.status, 200);
  assert.equal(result.owner, 'user-123');
  assert.deepEqual(result.body, {
    projects: sampleProjects,
    pagination: {
      total: 2,
      limit: 20,
      offset: 0,
    },
  });
});

// TEST 2: Missing authentication
test('rejects getting projects without a token', async () => {
  const result = await requestGet({});

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, {
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required.',
    },
  });
});

// TEST 3: Invalid authentication
test('rejects getting projects with an invalid token', async () => {
  const result = await requestGet({
    authorization: 'Bearer invalid-token',
  });

  assert.equal(result.status, 401);
  assert.equal(
    (result.body as { error: { code: string } }).error.code,
    'UNAUTHENTICATED',
  );
});

// TEST 4: Search projects by name
test('passes the project name search to the repository', async () => {
  const result = await requestGet({
    authorization: `Bearer ${tokenFor()}`,
    search: 'House',
    projects: [sampleProjects[0]],
  });

  assert.equal(result.status, 200);
  assert.equal(result.search, 'House');
  assert.deepEqual(
    (result.body as { projects: typeof sampleProjects }).projects,
    [sampleProjects[0]],
  );
});

// TEST 5: No matching projects
test('returns an empty list when no projects match the search', async () => {
  const result = await requestGet({
    authorization: `Bearer ${tokenFor()}`,
    search: 'xyz123',
    projects: [],
  });

  assert.equal(result.status, 200);
  assert.equal(result.search, 'xyz123');
  assert.deepEqual(result.body, {
    projects: [],
    pagination: {
      total: 0,
      limit: 20,
      offset: 0,
    },
  });
});

// TEST 6: Search with extra spaces
test('trims extra spaces from the search text', async () => {
  const result = await requestGet({
    authorization: `Bearer ${tokenFor()}`,
    search: '  House  ',
  });

  assert.equal(result.status, 200);
  assert.equal(result.search, 'House');
});

// TEST 7: Invalid search parameter
test('rejects a search parameter that is not a string', async () => {
  const result = await requestGet({
    authorization: `Bearer ${tokenFor()}`,
    search: ['House', 'Garden'],
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Search must be a string.',
    },
  });
});
