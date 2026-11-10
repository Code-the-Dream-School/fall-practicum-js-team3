/*
  Mock projects API (development only).
  Imitates GET /api/projects from the API documentation:
  401 without a valid token, otherwise 200 with { projects: [...] },
  filtered by the optional "search" query and sorted with the newest first.
*/

import { delay, http, HttpResponse } from 'msw'
import { findUserByToken } from './authHandlers.ts'
import type { Project } from '../types/project.ts'

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

export const projectHandlers = [
  // GET /api/projects?search=...: the logged-in user's projects
  http.get('*/api/projects', async ({ request }) => {
    // A short pause, so the "Loading..." state is visible while we build the page
    await delay(600)

    if (!findUserByToken(request)) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'No valid session.' } },
        { status: 401 },
      )
    }

    const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase() ?? ''

    const matchingProjects = sampleProjects
      .filter((project) => project.name.toLowerCase().includes(search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

        return HttpResponse.json({ projects: matchingProjects })
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