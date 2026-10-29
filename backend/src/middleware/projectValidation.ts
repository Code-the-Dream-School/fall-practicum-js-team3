import type { NextFunction, Request, Response } from 'express';

export const BLOCK_TYPES = ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus'] as const;

export interface ProjectBlock {
  shapeId: string;
  type: typeof BLOCK_TYPES[number];
  colorHex: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  dimensions?: { w: number; h: number; d: number };
  groupId?: string;
}

export interface CreateProjectBody {
  projectName: string;
  difficulty: 'Brick' | 'Builder' | 'Engineer';
}

export interface ReplaceProjectShapesBody {
  sceneData: ProjectBlock[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isProjectBlock = (value: unknown): value is ProjectBlock => {
  if (!isRecord(value) || !isRecord(value.position) || !isRecord(value.rotation)) return false;

  const { shapeId, type, colorHex, position, rotation, dimensions, groupId } = value;
  return (
    typeof shapeId === 'string' &&
    shapeId.trim().length > 0 &&
    shapeId.length <= 100 &&
    typeof type === 'string' &&
    BLOCK_TYPES.includes(type as ProjectBlock['type']) &&
    typeof colorHex === 'string' &&
    /^#[\da-f]{6}$/i.test(colorHex) &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(position.z) &&
    Number.isFinite(rotation.x) &&
    Number.isFinite(rotation.y) &&
    Number.isFinite(rotation.z) &&
    (dimensions === undefined || (
      isRecord(dimensions) &&
      Number.isFinite(dimensions.w) &&
      Number.isFinite(dimensions.h) &&
      Number.isFinite(dimensions.d)
    )) &&
    (groupId === undefined || (typeof groupId === 'string' && groupId.length <= 100))
  );
};

const validationError = (res: Response, message: string): void => {
  res.status(422).json({ success: false, message });
};

export const validateCreateProject = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: unknown = req.body;
  if (
    !isRecord(body) ||
    typeof body.projectName !== 'string' ||
    typeof body.difficulty !== 'string'
  ) {
    validationError(res, 'Project name and difficulty are required.');
    return;
  }

  const projectName = body.projectName.trim();
  if (!projectName || projectName.length > 100) {
    validationError(res, 'Project name must be between 1 and 100 characters.');
    return;
  }
  if (!['Brick', 'Builder', 'Engineer'].includes(body.difficulty)) {
    validationError(res, 'Difficulty must be Brick, Builder, or Engineer.');
    return;
  }

  req.body = { projectName, difficulty: body.difficulty as CreateProjectBody['difficulty'] };
  next();
};

export const validateReplaceProjectShapes = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: unknown = req.body;
  if (!isRecord(body) || !Array.isArray(body.sceneData)) {
    validationError(res, 'A sceneData array is required.');
    return;
  }

  if (body.sceneData.length > 500) {
    res.status(409).json({ success: false, message: 'A project can contain at most 500 shapes.' });
    return;
  }

  if (!body.sceneData.every(isProjectBlock)) {
    validationError(res, 'Each scene item must match the sceneData_Structure schema.');
    return;
  }

  const ids = body.sceneData.map((shape) => shape.shapeId);
  if (new Set(ids).size !== ids.length) {
    validationError(res, 'Shape ids must be unique within a project.');
    return;
  }

  req.body = { sceneData: body.sceneData } satisfies ReplaceProjectShapesBody;
  next();
};

export const validateProjectId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!/^[\da-f]{24}$/i.test(req.params.projectId)) {
    validationError(res, 'Project id must be a MongoDB ObjectId.');
    return;
  }

  next();
};