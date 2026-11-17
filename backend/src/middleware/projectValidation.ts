import type { NextFunction, Request, Response } from 'express';
import { validateDesign, type Design } from '../validation/projectDesign';

export interface CreateProjectBody {
  name: string;
  design: Design;
}

const reject = (res: Response, message: string): void => {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
};

export const validateCreateProjectBody = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    reject(res, 'A JSON object with name and design is required.');
    return;
  }

  const raw = body as Record<string, unknown>;
  if (typeof raw.name !== 'string' || raw.name.trim().length < 1 || raw.name.trim().length > 100) {
    reject(res, 'name must be 1 to 100 characters.');
    return;
  }

  const designResult = validateDesign(raw.design);
  if (!designResult.valid) {
    reject(res, designResult.message);
    return;
  }

  // Keep only fields the create contract accepts. In particular, owner is never
  // copied from client input; the controller reads it from the verified JWT.
  req.body = { name: raw.name.trim(), design: raw.design as Design } satisfies CreateProjectBody;
  next();
};
