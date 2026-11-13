import type { NextFunction, Request, Response } from 'express';
import {
  createProject as saveProject,
  type ProjectSummary,
} from '../repositories/projectRepository';
import type { CreateProjectBody } from '../middleware/projectValidation';

type CreateProject = (owner: unknown, input: CreateProjectBody) => Promise<ProjectSummary>;

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

