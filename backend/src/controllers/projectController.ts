import type { NextFunction, Request, Response } from 'express';
import {
  createProject as saveProject,
  deleteProject,
  listProjects,
  getProject as findProject,
  updateProject as saveChanges,
  type ProjectSummary,
  type ProjectView,
} from '../repositories/projectRepository';
import type { CreateProjectBody } from '../middleware/projectValidation';
import { ApiError } from '../errors/ApiError';

// CREATE PROJECT
type CreateProject = (owner: unknown, input: CreateProjectBody) => Promise<ProjectSummary>;
type GetProject = (owner: unknown, id: unknown) => Promise<ProjectView | null>;
type UpdateProject = (owner: unknown, id: unknown, changes: CreateProjectBody) => Promise<ProjectView | null>;

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

// GET PROJECTS 
export async function getProjectsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId: unknown = res.locals.userId;
    const search = req.query.search;

    if (search !== undefined && typeof search !== 'string') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Search must be a string.');
    }

    const result = await listProjects(userId, {
      search: search?.trim() ?? '',
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

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

  // UPDATE PROJECT (TEAM3-138)
// The owner comes from the login token (res.locals.userId), never from the request body.
// A missing project and a project owned by someone else both give the same 404.
export const makeUpdateProjectHandler = (update: UpdateProject = saveChanges) =>
  async (
    req: Request<{ id: string }, {}, CreateProjectBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const owner: unknown = res.locals.userId;
      const project = await update(owner, req.params.id, req.body);
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

