import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import type { CreateProjectBody, ReplaceProjectShapesBody } from '../middleware/projectValidation';
import { createProject, replaceProjectScene } from '../repositories/projectRepository';

const getUserId = (res: Response): string => {
  const userId: unknown = res.locals.userId;
  if (typeof userId !== 'string') throw new ApiError(401, 'Authentication is required.');
  return userId;
};

export const createProjectHandler = async (
  req: Request<{}, {}, CreateProjectBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await createProject(getUserId(res), req.body);
    res.status(201).json({
      id: project.id,
      projectName: project.projectName,
      difficulty: project.difficulty,
      lastSaved: project.lastSaved,
    });
  } catch (error) {
    next(error);
  }
};

export const replaceProjectShapesHandler = async (
  req: Request<{ projectId: string }, {}, ReplaceProjectShapesBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await replaceProjectScene(
      getUserId(res),
      req.params.projectId,
      req.body.sceneData,
    );
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    res.status(200).json({
      id: project.id,
      projectName: project.projectName,
      difficulty: project.difficulty,
      lastSaved: project.lastSaved,
      sceneData: req.body.sceneData,
    });
  } catch (error) {
    next(error);
  }
};