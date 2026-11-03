import type { NextFunction, Request, Response } from 'express';
import type { LoginBody } from '../middleware/authValidation';
import { authenticateUser, getPublicUserById } from '../services/authService';

export const loginUser = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const auth = await authenticateUser(email, password);

    res.status(200).json(auth);
  } catch (error) {
    next(error);
  }
};

export const logoutUser = (_req: Request, res: Response): void => {
  res.sendStatus(204);
};

export const getCurrentUser = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId: unknown = res.locals.userId;
    if (typeof userId !== 'string') {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
      });
      return;
    }

    const user = await getPublicUserById(userId);
    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication is no longer valid.' },
      });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
