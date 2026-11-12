import type { Request, Response, NextFunction } from 'express';
import { deleteProject } from '../repositories/projectRepository';
import { ApiError } from '../errors/ApiError';

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
