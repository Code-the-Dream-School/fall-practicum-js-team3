import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { requireAuth } from './requireAuth';

const SECRET = 'a'.repeat(32);
process.env.JWT_SECRET = SECRET;

// Runs the middleware with a fake request and records what it did.
function run(authorization?: string) {
  const req = {
    header: (name: string) => (name.toLowerCase() === 'authorization' ? authorization : undefined),
  } as unknown as Request;

  const result = { status: 0, body: undefined as unknown, nextCalled: false, nextArg: undefined as unknown };
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

  requireAuth(req, res, (arg?: unknown) => {
    result.nextCalled = true;
    result.nextArg = arg;
  });
  return { ...result, locals: res.locals };
}

function assertUnauthenticated(result: ReturnType<typeof run>) {
  assert.equal(result.status, 401);
  assert.equal((result.body as { error: { code: string } }).error.code, 'UNAUTHENTICATED');
  assert.equal(result.nextCalled, false);
}

test('rejects a request with no Authorization header', () => {
  assertUnauthenticated(run());
});

test('rejects a header that is not a Bearer token', () => {
  assertUnauthenticated(run('Basic abc123'));
});

test('rejects a token that is not a JWT', () => {
  assertUnauthenticated(run('Bearer not-a-jwt'));
});

test('rejects an expired token', () => {
  const token = jwt.sign({}, SECRET, { subject: 'user-1', expiresIn: -10 });
  assertUnauthenticated(run(`Bearer ${token}`));
});

test('rejects a valid token that has no subject', () => {
  const token = jwt.sign({ email: 'a@b.co' }, SECRET);
  assertUnauthenticated(run(`Bearer ${token}`));
});

test('rejects a token signed with another secret', () => {
  const token = jwt.sign({}, 'b'.repeat(32), { subject: 'user-1' });
  assertUnauthenticated(run(`Bearer ${token}`));
});

test('accepts a valid token and sets the user id from sub', () => {
  const token = jwt.sign({}, SECRET, { subject: 'user-1', expiresIn: '15m' });
  const result = run(`Bearer ${token}`);
  assert.equal(result.nextCalled, true);
  assert.equal(result.nextArg, undefined);
  assert.equal(result.locals.userId, 'user-1');
});

test('rejects a Bearer header with no token', () => {
  assertUnauthenticated(run('Bearer'));
  assertUnauthenticated(run('Bearer '));
});

test('rejects an unsigned token (alg none)', () => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'user-1' })}.`;
  assertUnauthenticated(run(`Bearer ${token}`));
});

test('rejects a token signed with another algorithm (HS512)', () => {
  const token = jwt.sign({}, SECRET, { subject: 'user-1', algorithm: 'HS512' });
  assertUnauthenticated(run(`Bearer ${token}`));//
});

test('passes a server error on when JWT_SECRET is not configured', () => {
  delete process.env.JWT_SECRET;
  try {
    const result = run('Bearer anything');
    assert.equal(result.nextCalled, true);
    assert.ok(result.nextArg instanceof Error);
  } finally {
    process.env.JWT_SECRET = SECRET;
  }
});

test('rejects a subject that is blank or not a string', () => {
  for (const sub of ['', '   ', 12345, { id: 'user-1' }]) {
    const token = jwt.sign({ sub }, SECRET);
    assertUnauthenticated(run(`Bearer ${token}`));
  }
});

test('accepts a lowercase bearer scheme', () => {
  const token = jwt.sign({}, SECRET, { subject: 'user-1', expiresIn: '15m' });
  const result = run(`bearer ${token}`);
  assert.equal(result.nextCalled, true);
  assert.equal(result.locals.userId, 'user-1');
});