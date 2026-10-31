import bcrypt from 'bcryptjs';
import { ApiError } from '../errors/ApiError';
import { findUserByEmail, findUserById } from '../repositories/userRepository';
import { createAccessToken } from './tokenService';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export const authenticateUser = async (email: string, password: string): Promise<AuthResult> => {
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  return {
    token: createAccessToken(user),
    user: { id: user.id, name: user.username, email: user.email },
  };
};

export const getPublicUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await findUserById(id);
  if (!user) return null;

  return { id: user.id, name: user.username, email: user.email };
};
