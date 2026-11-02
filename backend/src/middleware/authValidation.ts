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

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

const validationError = (res: Response, message: string): void => {
  res.status(422).json({ error: { code: 'VALIDATION_ERROR', message } });
};

export const validateRegisterBody = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'A JSON object with name, email and password is required.' },
    });
    return;
  }

  // The API documents the field as `name`; `username` is accepted as an alias.
  const raw = body as Record<string, unknown>;
  const name = raw.name ?? raw.username;
  const { email, password } = raw;

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 50) {
    validationError(res, 'Name must be 1-50 characters.');
    return;
  }
  if (
    typeof email !== 'string' ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    validationError(res, 'Provide a valid email address (maximum 254 characters).');
    return;
  }
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    validationError(res, 'Password must be 8-128 characters and at most 72 bytes.');
    return;
  }

  req.body = {
    username: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  } satisfies RegisterBody;
  next();
};
