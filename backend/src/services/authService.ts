import bcrypt from "bcryptjs";
import { ApiError } from "../errors/ApiError";
import { findUserByEmail, insertUser } from "../repositories/userRepository";
import { createAccessToken } from "./tokenService";

export interface PublicUser {
  id: string;
  username: string | null;
  email: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return {
    token: createAccessToken(user),
    user: { id: user.id, username: user.username, email: user.email }
  };
};

export const createUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await insertUser(username, email, password);
  return {
    token: createAccessToken(user),
    user: { id: user.id, username: user.username, email: user.email }
  };
};
