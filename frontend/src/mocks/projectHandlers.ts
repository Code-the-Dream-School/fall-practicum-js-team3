import { http, HttpResponse } from 'msw';
import { findUserByToken } from './authHandlers';

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

export const projectHandlers = [
  http.post('*/api/projects', async ({ request }) => {
    if (!findUserByToken(request)) {
      return error(401, 'UNAUTHENTICATED', 'Authentication is required.');
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return error(400, 'INVALID_REQUEST', 'A JSON object with a project name is required.');
    }
    if (!('name' in body) || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) {
      return error(422, 'VALIDATION_ERROR', 'Project name must be 1-100 characters.');
    }
    if (!('design' in body) || !body.design || typeof body.design !== 'object'
      || !('version' in body.design) || body.design.version !== 1
      || !('blocks' in body.design) || !Array.isArray(body.design.blocks)) {
      return error(422, 'VALIDATION_ERROR', 'Invalid design.');
    }
    if (body.design.blocks.length > 500) {
      return error(409, 'SHAPE_LIMIT_REACHED', 'A project can contain at most 500 shapes.');
    }

    const timestamp = new Date().toISOString();
    return HttpResponse.json({
      id: crypto.randomUUID(),
      name: body.name.trim(),
      difficulty: 'Brick',
      createdAt: timestamp,
      updatedAt: timestamp,
    }, { status: 201 });
  }),
];
