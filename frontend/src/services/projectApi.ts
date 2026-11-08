import { apiRequest } from './apiClient';
import type { CreateProjectPayload, Project, ProjectListResponse } from '../types/project';

export const createProject = (payload: CreateProjectPayload, token: string) =>
  apiRequest<Project>('/projects', { method: 'POST', body: payload, token });

export const fetchProjects = (token: string, search = '', signal?: AbortSignal) => {
  const trimmedSearch = search.trim();
  const query = trimmedSearch ? `?search=${encodeURIComponent(trimmedSearch)}` : '';
  return apiRequest<ProjectListResponse>(`/projects${query}`, { token, signal });
};
