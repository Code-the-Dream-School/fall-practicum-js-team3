/*
  Project requests. For now there is one: creating (saving) a project.
  The token is required, so the server can attach the project to the logged-in user.
*/
import { apiRequest } from './apiClient';
import type { CreateProjectPayload, Project } from '../types/project';

/** Creates a project (POST /projects). Returns the new project with its id. */
export const createProject = (payload: CreateProjectPayload, token: string) =>
  apiRequest<Project>('/projects', { method: 'POST', body: payload, token });
