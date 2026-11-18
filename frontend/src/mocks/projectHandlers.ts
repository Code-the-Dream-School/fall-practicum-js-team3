/*
  Mock project API (development only): create projects, list/search them, and open one project with its design.
  Projects live in memory and disappear when the page reloads.
*/
import { delay, http, HttpResponse } from 'msw'
import type { CreateProjectPayload, DesignJson, Project } from '../types/project.ts'
import { errorResponse, findUserByToken } from './authHandlers.ts'

// Sample data. Every logged-in user sees the same list; that is enough to build the page
let sampleProjects: Project[] = [

  { id: 'project_1', name: 'Robot', createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-20T15:30:00Z' },
  { id: 'project_2', name: 'My first castle', createdAt: '2026-10-05T09:00:00Z', updatedAt: '2026-10-12T18:00:00Z' },
  { id: 'project_3', name: 'Rocket ship', createdAt: '2026-10-08T14:00:00Z', updatedAt: '2026-10-25T08:45:00Z' },
  { id: 'project_4', name: 'Robot dog', createdAt: '2026-10-10T11:20:00Z', updatedAt: '2026-10-10T11:20:00Z' },
  { id: 'project_5', name: 'Robot 2', createdAt: '2026-10-11T08:00:00Z', updatedAt: '2026-10-22T19:10:00Z' },
  { id: 'project_6', name: 'ROBOT PARTY', createdAt: '2026-10-12T16:00:00Z', updatedAt: '2026-10-18T12:00:00Z' },
  { id: 'project_7', name: "Tom & Jerry's house", createdAt: '2026-10-13T13:30:00Z', updatedAt: '2026-10-24T09:15:00Z' },
  { id: 'project_8', name: 'A very long name for a project that keeps going and going', createdAt: '2026-10-14T10:10:00Z', updatedAt: '2026-10-15T10:10:00Z' },
  { id: 'project_9', name: 'Super robot arm', createdAt: '2026-09-02T09:00:00Z', updatedAt: '2026-09-02T09:00:00Z' },
  { id: 'project_10', name: 'Мій перший будинок', createdAt: '2026-10-15T12:00:00Z', updatedAt: '2026-10-21T07:30:00Z' },
  { id: 'project_11', name: 'x', createdAt: '2026-10-28T17:00:00Z', updatedAt: '2026-10-31T20:45:00Z' },
  { id: 'project_12', name: 'bridge 3000', createdAt: '2026-10-16T15:00:00Z', updatedAt: '2026-10-20T15:30:00Z' },
]

const projects: Project[] = [...sampleProjects]

// Designs saved by the mock POST, kept by project id
const designs = new Map<string, DesignJson>()

// Design shown for the sample projects: one shape of every type, plus two recolored extras
const sampleDesign: DesignJson = {
  version: 1,
  blocks: [
    { id: 1, type: 'cube', color: '#0ea5e9', position: { x: -4, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
    { id: 2, type: 'sphere', color: '#ef4444', position: { x: -2.4, y: 0, z: 0 }, scale: 1.2, rotation: { x: 0, y: 0, z: 0 } },
    { id: 3, type: 'cylinder', color: '#10b981', position: { x: -0.8, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0.5, z: 0 } },
    { id: 4, type: 'cone', color: '#eab308', position: { x: 0.8, y: 0, z: 0 }, scale: 1.2, rotation: { x: 0, y: 0, z: 0 } },
    { id: 5, type: 'pyramid', color: '#a855f7', position: { x: 2.4, y: 0, z: 0 }, scale: 0.8, rotation: { x: 0, y: 0.8, z: 0 } },
    { id: 6, type: 'torus', color: '#f97316', position: { x: 4, y: 0, z: 0 }, scale: 1, rotation: { x: 1, y: 0, z: 0 } },
    { id: 7, type: 'cube', color: '#ef4444', position: { x: -2.4, y: 0, z: -2 }, scale: 0.7, rotation: { x: 0, y: 0.4, z: 0 } },
    { id: 8, type: 'sphere', color: '#0ea5e9', position: { x: 0.8, y: 0, z: -2 }, scale: 0.8, rotation: { x: 0, y: 0, z: 0 } },
  ],
}

export const projectHandlers = [
  // POST /api/projects: creates a project for the logged-in user
  http.post('*/api/projects', async ({ request }) => {
    if (!findUserByToken(request)) {
      return errorResponse(401, 'UNAUTHENTICATED', 'No valid session.')
    }

    let body: Partial<CreateProjectPayload>
    try {
      body = (await request.json()) as Partial<CreateProjectPayload>
    } catch {
      return errorResponse(400, 'INVALID_REQUEST', 'Body is missing or is not valid JSON.')
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (name.length < 1 || name.length > 100) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Project name must be 1-100 characters.')
    }

    const now = new Date().toISOString()
    const project: Project = { id: `project_${projects.length + 1}`, name, createdAt: now, updatedAt: now }
    projects.push(project)
    if (body.design) designs.set(project.id, body.design)
    return HttpResponse.json(project, { status: 201 })
  }),

  // GET /api/projects?search=...: the logged-in user's projects
  http.get('*/api/projects', async ({ request }) => {
    await delay(600)
    if (!findUserByToken(request)) {
      return errorResponse(401, 'UNAUTHENTICATED', 'No valid session.')
    }

    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase() ?? ''
    const matchingProjects = projects
      .filter((project) => project.name.toLowerCase().includes(search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

        return HttpResponse.json({ projects: matchingProjects })
  }),

  // GET /api/projects/:projectId: one project with its design
  http.get('*/api/projects/:projectId', async ({ request, params }) => {
    await delay(600)
    if (!findUserByToken(request)) {
      return errorResponse(401, 'UNAUTHENTICATED', 'No valid session.')
    }

    const project = projects.find((item) => item.id === params.projectId)
    if (!project) {
      return errorResponse(404, 'PROJECT_NOT_FOUND', 'Project not found.')
    }
    return HttpResponse.json({ ...project, design: designs.get(project.id) ?? sampleDesign })
  }),
  
  // DELETE /api/projects/:projectId
  http.delete('*/api/projects/:projectId', async ({ request, params }) => {
    // Simulate a short server delay
    await delay(400)

    // Check authentication
    if (!findUserByToken(request)) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'No valid session.' } },
        { status: 401 },
      )
    }

    const projectId = params.projectId

    // Check whether the project exists
    const projectExists = sampleProjects.some(
      (project) => project.id === projectId
    )

    if (!projectExists) {
      return HttpResponse.json(
        {
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found.',
          },
        },
        { status: 404 },
      )
    }

    // Remove the project from the mock data
    sampleProjects = sampleProjects.filter(
      (project) => project.id !== projectId
    )

    // Successful deletion, no response body
    return new HttpResponse(null, { status: 204 })
  }),
]
