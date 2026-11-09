import { apiRequest } from './apiClient';
import type { CreateProjectPayload, Project, ProjectListResponse } from '../types/project';

/** Creates a project (POST /projects). Returns the new project with its id. */
export const createProject = (payload: CreateProjectPayload, token: string) =>
  apiRequest<Project>('/projects', { method: 'POST', body: payload, token });

// Gets the logged-in user's projects (GET /projects), optionally filtered by name.
export const fetchProjects = (token: string, search = '', signal?: AbortSignal) => {
  const trimmedSearch = search.trim();
  const query = trimmedSearch ? `?search=${encodeURIComponent(trimmedSearch)}` : '';
  return apiRequest<ProjectListResponse>(`/projects${query}`, { token, signal });
};
