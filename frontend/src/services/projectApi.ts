import { apiRequest } from './apiClient';
import type { Design } from '../hooks/useDesignStore';

export interface Project {
  id: string;
  name: string;
  difficulty: 'Brick' | 'Builder' | 'Engineer';
  createdAt: string;
  updatedAt: string;
}

export const createProject = (name: string, design: Design, token: string) =>
  apiRequest<Project>('/projects', { method: 'POST', body: { name, design }, token });
