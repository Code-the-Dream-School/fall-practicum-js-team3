import type { NextFunction, Request, Response } from 'express';
import type { LoginBody } from '../middleware/authValidation';
import { authenticateUser } from '../services/authService';

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
  // The client ends the session by deleting its token.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Remove the access token from the client.',
    data: {},
  });
};
