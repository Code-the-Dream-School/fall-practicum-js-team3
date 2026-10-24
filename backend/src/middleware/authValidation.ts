import type { Request, Response, NextFunction } from "express";

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export const validateLoginBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body: unknown = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({
      success: false,
      message: "A JSON object with email and password is required."
    });
    return;
  }

  const { email, password } = body as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length === 0 ||
    password.length > 128
  ) {
    res
      .status(400)
      .json({ success: false, message: "Provide a valid email and password." });
    return;
  }

  req.body = {
    email: email.trim().toLowerCase(),
    password
  } satisfies LoginBody;
  next();
};

export const validateRegisterBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body: unknown = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({
      success: false,
      message: "A JSON object with email and password is required."
    });
    return;
  }

  const { username, email, password } = body as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof username !== "string" ||
    !username.trim() ||
    !email.trim() ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length === 0 ||
    password.length > 128
  ) {
    res
      .status(400)
      .json({
        success: false,
        message: "Provide a valid username, email, and password"
      });
    return;
  }

  req.body = {
    username,
    email: email.trim().toLowerCase(),
    password
  } satisfies RegisterBody;
  next();
};
