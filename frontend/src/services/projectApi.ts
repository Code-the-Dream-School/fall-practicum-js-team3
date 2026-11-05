import { apiRequest } from './apiClient';
import type { ProjectListResponse } from '../types/project';

// Gets the logged-in user's projects (GET /projects).
// When "search" has text, the server returns only the projects whose name matches it.
// "signal" lets the page cancel an old request when the user types again.
export const fetchProjects = (token: string, search = '', signal?: AbortSignal) => {
  const trimmedSearch = search.trim();
  // encodeURIComponent keeps spaces and characters like & from breaking the address
  const query = trimmedSearch ? `?search=${encodeURIComponent(trimmedSearch)}` : '';
  return apiRequest<ProjectListResponse>(`/projects${query}`, { token, signal });
};