import { apiRequest } from './apiClient';
import type { CreateProjectPayload, Project, ProjectListResponse, ProjectWithDesign } from '../types/project';

/** Creates a project (POST /projects). Returns the new project with its id. */
export const createProject = (payload: CreateProjectPayload, token: string) =>
  apiRequest<Project>('/projects', { method: 'POST', body: payload, token });

/** Updates the opened project (PUT /projects/:id). */
export const updateProject = (projectId: string, payload: CreateProjectPayload, token: string) =>
  apiRequest<ProjectWithDesign>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: payload,
    token,
  });

// Gets the logged-in user's projects (GET /projects), optionally filtered by name.
export const fetchProjects = (token: string, search = '', signal?: AbortSignal) => {
  const trimmedSearch = search.trim();
  const query = trimmedSearch ? `?search=${encodeURIComponent(trimmedSearch)}` : '';
  return apiRequest<ProjectListResponse>(`/projects${query}`, { token, signal });
};

// Deletes a project belonging to the logged-in user.
// The backend should return 204 No Content on success.
export const deleteProject = (token: string, projectId: string) => {
  return apiRequest<void>(
    `/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'DELETE',
      token,
    }
  );
};

// Gets one project with its design (GET /projects/:id), to open it in the editor.
export const fetchProject = (token: string, projectId: string, signal?: AbortSignal) =>
  apiRequest<ProjectWithDesign>(`/projects/${encodeURIComponent(projectId)}`, { token, signal });
