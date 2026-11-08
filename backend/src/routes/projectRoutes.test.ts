import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { after, before, beforeEach, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_SECRET = SECRET;

import app from '../app';
import { projectRepository, type NewProject } from '../repositories/projectRepository';

const USER_ID = '11111111-2222-4333-8444-555555555555';

const originalCreate = projectRepository.create;
const originalList = projectRepository.list;
const originalFindById = projectRepository.findById;
let created: NewProject[] = [];
let server: Server;
let baseUrl: string;

const tokenFor = (userId: string, secret = SECRET, expiresIn: jwt.SignOptions['expiresIn'] = '15m') =>
  jwt.sign({ email: 'person@example.com' }, secret, { subject: userId, expiresIn });

const block = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  type: 'cube',
  color: '#0ea5e9',
  position: { x: 0, y: 0, z: 0 },
  scale: 1,
  ...overrides,
});

const post = async (body: unknown, token: string | null = tokenFor(USER_ID), raw = false) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers,
    body: raw ? (body as string) : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
};

const assertError = (result: { status: number; body: any }, status: number, code: string) => {
  assert.equal(result.status, status);
  assert.equal(result.body.error.code, code);
  assert.equal(typeof result.body.error.message, 'string');
};

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  projectRepository.create = originalCreate;
  projectRepository.list = originalList;
  projectRepository.findById = originalFindById;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  created = [];
  projectRepository.create = async (project) => {
    created.push(project);
    return {
      id: '64b7f0c2a1b2c3d4e5f60718',
      name: project.projectName,
      difficulty: project.difficulty,
      createdAt: new Date('2026-11-02T12:00:00.000Z'),
      updatedAt: new Date('2026-11-02T12:00:01.000Z'),
    };
  };
});

describe('project routes', () => {
  describe('success', () => {
    it('returns 201 with the project in the agreed shape', async () => {
      const result = await post({ name: 'First Model', design: { version: 1, blocks: [block()] } });

      assert.equal(result.status, 201);
      assert.deepEqual(result.body, {
        id: '64b7f0c2a1b2c3d4e5f60718',
        name: 'First Model',
        difficulty: 'Brick',
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:01.000Z',
      });
    });

    it('trims the name and passes the design blocks to the repository', async () => {
      await post({ name: '  Robot  ', design: { version: 1, blocks: [block({ id: 7, type: 'sphere' })] } });

      assert.equal(created.length, 1);
      assert.equal(created[0].projectName, 'Robot');
      assert.equal(created[0].blocks.length, 1);
      assert.equal(created[0].blocks[0].id, 7);
      assert.equal(created[0].blocks[0].type, 'sphere');
    });

    it('passes rotation and per-axis dimensions to the repository without changing them', async () => {
      const shape = block({
        position: { x: -1, y: 2, z: 3 },
        rotation: { x: 0.5, y: -1, z: 2 },
        scale: 3,
        dimensions: { w: 1, h: 2, d: 4 },
      });
      assert.equal((await post({ name: 'Transformed', design: { version: 1, blocks: [shape] } })).status, 201);
      assert.deepEqual(created[0].blocks, [shape]);
    });

    it('accepts projectName and difficulty, and a name of exactly 100 characters', async () => {
      const name = 'n'.repeat(100);
      const result = await post({ projectName: name, difficulty: 'Engineer' });

      assert.equal(result.status, 201);
      assert.equal(result.body.name, name);
      assert.equal(result.body.difficulty, 'Engineer');
      assert.deepEqual(created[0].blocks, []);
    });

    it('takes the owner from the token and ignores a userId in the body', async () => {
      const result = await post({ name: 'Mine', userId: 'attacker-id', owner: 'attacker-id' });

      assert.equal(result.status, 201);
      assert.equal(created[0].userId, USER_ID);
      assert.equal('userId' in result.body, false);
    });

    it('never returns the stored scene data or any password field', async () => {
      const result = await post({ name: 'Safe', design: { version: 1, blocks: [block()] } });

      assert.deepEqual(Object.keys(result.body).sort(), ['createdAt', 'difficulty', 'id', 'name', 'updatedAt']);
    });
  });

  describe('name validation', () => {
    for (const [label, body] of [
      ['missing', { design: { version: 1, blocks: [] } }],
      ['empty', { name: '' }],
      ['whitespace only', { name: '   ' }],
      ['not a string', { name: 123 }],
      ['101 characters', { name: 'n'.repeat(101) }],
    ] as const) {
      it(`rejects a ${label} name with 422 VALIDATION_ERROR`, async () => {
        assertError(await post(body), 422, 'VALIDATION_ERROR');
        assert.equal(created.length, 0);
      });
    }

    it('rejects an unknown difficulty', async () => {
      assertError(await post({ name: 'x', difficulty: 'Wizard' }), 422, 'VALIDATION_ERROR');
    });
  });

  describe('design validation', () => {
    const rejected: Array<[string, unknown, string]> = [
      ['not an object', 'blocks', 'design must be an object'],
      ['wrong version', { version: 2, blocks: [] }, 'design.version'],
      ['blocks not an array', { version: 1, blocks: {} }, 'design.blocks must be an array'],
      ['unknown shape type', { version: 1, blocks: [block({ type: 'dodecahedron' })] }, 'design.blocks[0].type'],
      ['bad color', { version: 1, blocks: [block(), block({ id: 2, color: 'red' })] }, 'design.blocks[1].color'],
      ['missing position axis', { version: 1, blocks: [block({ position: { x: 0, y: 0 } })] }, 'design.blocks[0].position.z'],
      ['non-numeric position', { version: 1, blocks: [block({ position: { x: 'a', y: 0, z: 0 } })] }, 'design.blocks[0].position.x'],
      ['zero scale', { version: 1, blocks: [block({ scale: 0 })] }, 'design.blocks[0].scale'],
      ['invalid rotation', { version: 1, blocks: [block({ rotation: { x: 0, y: 'bad', z: 0 } })] }, 'design.blocks[0].rotation.y'],
      ['missing rotation axis', { version: 1, blocks: [block({ rotation: { x: 0, y: 0 } })] }, 'design.blocks[0].rotation.z'],
      ['invalid dimension', { version: 1, blocks: [block({ dimensions: { w: 1, h: -1, d: 1 } })] }, 'design.blocks[0].dimensions.h'],
      ['missing dimension', { version: 1, blocks: [block({ dimensions: { w: 1, h: 2 } })] }, 'design.blocks[0].dimensions.d'],
      ['duplicate ids', { version: 1, blocks: [block(), block()] }, 'design.blocks[1].id'],
    ];

    for (const [label, design, expected] of rejected) {
      it(`rejects a design with ${label} (422), naming the field`, async () => {
        const result = await post({ name: 'x', design });

        assertError(result, 422, 'VALIDATION_ERROR');
        assert.ok(result.body.error.message.includes(expected), result.body.error.message);
        assert.equal(created.length, 0);
      });

    }

    it('rejects more than 500 shapes with 409 SHAPE_LIMIT_REACHED', async () => {
      const blocks = Array.from({ length: 501 }, (_, index) => block({ id: index + 1 }));

      assertError(await post({ name: 'big', design: { version: 1, blocks } }), 409, 'SHAPE_LIMIT_REACHED');
    });

    it('accepts exactly 500 shapes', async () => {
      const blocks = Array.from({ length: 500 }, (_, index) => block({ id: index + 1 }));

      assert.equal((await post({ name: 'max', design: { version: 1, blocks } })).status, 201);
    });

    it('accepts 500 fully transformed shapes exceeding 128 KB', async () => {
      const blocks = Array.from({ length: 500 }, (_, id) => block({
        id,
        position: { x: 123456.123456789, y: -123456.123456789, z: 123456.123456789 },
        rotation: { x: 1.123456789, y: 2.123456789, z: 3.123456789 },
        scale: 1.123456789,
        dimensions: { w: 1.123456789, h: 2.123456789, d: 3.123456789 },
      }));
      const body = { name: 'Full scene', design: { version: 1, blocks } };
      assert.ok(Buffer.byteLength(JSON.stringify(body)) > 128 * 1024);
      assert.equal((await post(body)).status, 201);
      assert.deepEqual(created[0].blocks, blocks);
    });
  });

  describe('bad requests', () => {
    it('rejects an empty JSON object with 400 INVALID_REQUEST', async () => {
      assertError(await post({}), 400, 'INVALID_REQUEST');
    });

    it('rejects a JSON array with 400 INVALID_REQUEST', async () => {
      assertError(await post([{ name: 'x' }]), 400, 'INVALID_REQUEST');
    });

    it('rejects malformed JSON with 400 INVALID_REQUEST', async () => {
      assertError(await post('{bad', tokenFor(USER_ID), true), 400, 'INVALID_REQUEST');
    });

    it('rejects an oversized body with 413 PAYLOAD_TOO_LARGE', async () => {
      assertError(await post({ name: 'x', padding: 'a'.repeat(513 * 1024) }), 413, 'PAYLOAD_TOO_LARGE');
      assert.equal(created.length, 0);
    });
  });

  describe('authentication', () => {
    const body = { name: 'No access' };

    it('rejects a request with no token (401 UNAUTHENTICATED)', async () => {
      assertError(await post(body, null), 401, 'UNAUTHENTICATED');
      assert.equal(created.length, 0);
    });

    it('rejects a garbage token', async () => {
      assertError(await post(body, 'not-a-jwt'), 401, 'UNAUTHENTICATED');
    });

    it('rejects a token signed with another secret', async () => {
      const forged = tokenFor(USER_ID, 'another-secret-that-is-at-least-32-characters');

      assertError(await post(body, forged), 401, 'UNAUTHENTICATED');
    });

    it('rejects an expired token', async () => {
      assertError(await post(body, tokenFor(USER_ID, SECRET, -60)), 401, 'UNAUTHENTICATED');
    });

    it('checks the token before the body (no 422 leak to anonymous callers)', async () => {
      assertError(await post({ name: '' }, null), 401, 'UNAUTHENTICATED');
    });
  });

  describe('server errors', () => {
    it('returns 500 INTERNAL_ERROR without exposing the internal message', async () => {
      projectRepository.create = async () => {
        throw new Error('connection to mongodb://user:secret@host failed');
      };

      const result = await post({ name: 'Oops' });

      assertError(result, 500, 'INTERNAL_ERROR');
      assert.equal(JSON.stringify(result.body).includes('secret'), false);
    });
  });

  describe('project listing and retrieval', () => {
    const projectId = '64b7f0c2a1b2c3d4e5f60718';
    const get = async (path: string, token: string | null = tokenFor(USER_ID)) => {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${baseUrl}${path}`, { headers });
      return { status: response.status, body: await response.json() };
    };

    it('lists only projects requested for the authenticated user', async () => {
      let owner = '';
      projectRepository.list = async (userId) => {
        owner = userId;
        return [];
      };
      const result = await get('/api/projects');
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { projects: [] });
      assert.equal(owner, USER_ID);
      assertError(await get('/api/projects', null), 401, 'UNAUTHENTICATED');
    });

    it('retrieves a design only for its authenticated owner', async () => {
      const design = { version: 1 as const, blocks: [block()] };
      let query: string[] = [];
      projectRepository.findById = async (userId, id) => {
        query = [userId, id];
        return {
          id, name: 'Mine', difficulty: 'Brick',
          createdAt: new Date('2026-11-02T12:00:00Z'),
          updatedAt: new Date('2026-11-02T12:00:00Z'),
          design,
        };
      };
      const result = await get(`/api/projects/${projectId}`);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.design, design);
      assert.deepEqual(query, [USER_ID, projectId]);
      assertError(await get(`/api/projects/${projectId}`, null), 401, 'UNAUTHENTICATED');

      projectRepository.findById = async () => null;
      assertError(await get(`/api/projects/${projectId}`), 404, 'NOT_FOUND');
    });
  });
});
