import type { NextFunction, Request, Response } from 'express';
import { validateDesign, type DesignBlock } from '../validation/designValidation';

export const DIFFICULTIES = ['Brick', 'Builder', 'Engineer'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DEFAULT_DIFFICULTY: Difficulty = 'Brick';
export const MAX_PROJECT_NAME_LENGTH = 100;

export interface CreateProjectBody {
  projectName: string;
  difficulty: Difficulty;
  blocks: DesignBlock[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validationError = (res: Response, message: string): void => {
  res.status(422).json({ error: { code: 'VALIDATION_ERROR', message } });
};

// Accepts `name` (API doc) or `projectName` (stored field name). `userId` is never read from the body.
export const validateCreateProject = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: unknown = req.body;
  if (!isRecord(body) || Object.keys(body).length === 0) {
    res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'A JSON object with a project name is required.' },
    });
    return;
  }

  const rawName = body.name ?? body.projectName;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (!name || name.length > MAX_PROJECT_NAME_LENGTH) {
    validationError(res, `Project name must be 1-${MAX_PROJECT_NAME_LENGTH} characters.`);
    return;
  }

  const difficulty = body.difficulty ?? DEFAULT_DIFFICULTY;
  if (typeof difficulty !== 'string' || !DIFFICULTIES.includes(difficulty as Difficulty)) {
    validationError(res, `Difficulty must be one of: ${DIFFICULTIES.join(', ')}.`);
    return;
  }

  let blocks: DesignBlock[] = [];
  if (body.design !== undefined) {
    const design = validateDesign(body.design);
    if (!design.ok) {
      if (design.reason === 'too_many') {
        res.status(409).json({ error: { code: 'SHAPE_LIMIT_REACHED', message: design.message } });
      } else {
        validationError(res, design.message);
      }
      return;
    }
    blocks = design.blocks;
  }

  req.body = { projectName: name, difficulty: difficulty as Difficulty, blocks } satisfies CreateProjectBody;
  next();
};
