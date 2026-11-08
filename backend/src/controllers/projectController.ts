import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import type { CreateProjectBody } from '../middleware/projectValidation';
import { projectRepository } from '../repositories/projectRepository';

const authenticatedUserId = (res: Response): string => {
  const userId: unknown = res.locals.userId;
  if (typeof userId !== 'string') {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  }
  return userId;
};

export const createProjectHandler = async (
  req: Request<{}, {}, CreateProjectBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = authenticatedUserId(res);
    const project = await projectRepository.create({ ...req.body, userId });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const listProjectsHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await projectRepository.list(authenticatedUserId(res));
    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await projectRepository.findById(authenticatedUserId(res), req.params.projectId);
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found.');
    }
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};
