/*
  Mock project API (development only), answering as the API documentation says.
  A project name is checked the same way as the real endpoint: 1-100 characters after trimming.
  Projects live in memory and disappear when the page reloads.
*/

import { http, HttpResponse } from 'msw'
import type { CreateProjectPayload, Project } from '../types/project.ts'
import { errorResponse, findUserByToken } from './authHandlers.ts'

const projects: Project[] = []

export const projectHandlers = [
  // POST /api/projects: creates (saves) a project for the logged-in user
  http.post('*/api/projects', async ({ request }) => {
    // 1. No valid token -> 401
    if (!findUserByToken(request)) {
      return errorResponse(401, 'UNAUTHENTICATED', 'No valid session.')
    }

    // 2. The body is not JSON -> 400
    let body: Partial<CreateProjectPayload>
    try {
      body = (await request.json()) as Partial<CreateProjectPayload>
    } catch {
      return errorResponse(400, 'INVALID_REQUEST', 'Body is missing or is not valid JSON.')
    }

    // 3. The name is missing, empty or too long -> 422
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (name.length < 1 || name.length > 100) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Project name must be 1-100 characters.')
    }

    // 4. Answer 201 Created with the project, as in the documentation
    const now = new Date().toISOString()
    const project: Project = { id: `project_${projects.length + 1}`, name, createdAt: now, updatedAt: now }
    projects.push(project)
    return HttpResponse.json(project, { status: 201 })
  }),
]
