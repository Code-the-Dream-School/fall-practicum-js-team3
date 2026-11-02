import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.header('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
    });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    next(new Error('JWT_SECRET must be configured with at least 32 characters.'));
    return;
  }

  try {
    const payload = jwt.verify(match[1], secret);
    const userId = typeof payload === 'string' ? undefined : (payload as JwtPayload).sub;
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication token is invalid.' },
      });
      return;
    }

    res.locals.userId = userId;
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication token is invalid or expired.' },
    });
  }
};