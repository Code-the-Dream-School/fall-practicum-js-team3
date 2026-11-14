import type { NextFunction, Request, Response } from 'express';
import {
  createProject as saveProject,
  deleteProject,
  type ProjectSummary,
} from '../repositories/projectRepository';
import type { CreateProjectBody } from '../middleware/projectValidation';
import { ApiError } from '../errors/ApiError';

// CREATE PROJECT
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

// DELETE PROJECT
export async function deleteProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = res.locals.userId;
    const projectId = req.params.projectId;
    const deleted = await deleteProject(userId, projectId);
    if (!deleted) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}


