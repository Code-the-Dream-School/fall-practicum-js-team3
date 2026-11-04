import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import type { CreateProjectBody } from '../middleware/projectValidation';
import { projectRepository } from '../repositories/projectRepository';

export const createProjectHandler = async (
  req: Request<{}, {}, CreateProjectBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // The owner always comes from the verified token (set by requireAuth), never from the body.
    const userId: unknown = res.locals.userId;
    if (typeof userId !== 'string') {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    }

    const project = await projectRepository.create({ ...req.body, userId });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};
