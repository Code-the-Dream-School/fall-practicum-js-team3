import type { NextFunction, Request, Response } from 'express';
import {
  createProject as saveProject,
  getProject as findProject,
  type ProjectSummary,
  type ProjectView,
} from '../repositories/projectRepository';
import type { CreateProjectBody } from '../middleware/projectValidation';

type CreateProject = (owner: unknown, input: CreateProjectBody) => Promise<ProjectSummary>;
type GetProject = (owner: unknown, id: unknown) => Promise<ProjectView | null>;

export const makeCreateProjectHandler = (create: CreateProject = saveProject) =>
  async (req: Request<{}, {}, CreateProjectBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const owner: unknown = res.locals.userId;
      const project = await create(owner, req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  };

export const makeGetProjectHandler = (get: GetProject = findProject) =>
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const owner: unknown = res.locals.userId;
      const project = await get(owner, req.params.id);
      if (!project) {
        res.status(404).json({
          error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
        });
        return;
      }

      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  };

