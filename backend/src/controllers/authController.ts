import type { NextFunction, Request, Response } from "express";
import type { LoginBody } from "../middleware/authValidation";
import { ACCESS_TOKEN_TTL } from "../services/tokenService";
import { authenticateUser, createUser } from "../services/authService";

export const loginUser = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const auth = await authenticateUser(email, password);

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: { ...auth, expiresIn: ACCESS_TOKEN_TTL }
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = (_req: Request, res: Response): void => {
  // The client ends the session by deleting its token.
  res.status(200).json({
    success: true,
    message:
      "Logged out successfully. Remove the access token from the client.",
    data: {}
  });
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const user = await createUser(username, email, password);

    res.status(200).json({
      success: true,
      message: "Registered user successfully.",
      data: { ...user, expiresIn: ACCESS_TOKEN_TTL }
    });
  } catch (error) {
    next(error);
  }
};
