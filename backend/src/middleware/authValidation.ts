import type { Request, Response, NextFunction } from 'express';

export interface LoginBody {
  email: string;
  password: string;
}

export const validateLoginBody = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A JSON object with email and password is required.',
      },
    });
    return;
  }

  const { email, password } = body as Record<string, unknown>;
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length === 0 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide a valid email and password.',
      },
    });
    return;
  }

  req.body = { email: email.trim().toLowerCase(), password } satisfies LoginBody;
  next();
};
