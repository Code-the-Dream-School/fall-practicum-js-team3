import bcrypt from 'bcryptjs';
import { ApiError } from '../errors/ApiError';
import { DuplicateUserError, findUserByEmail, findUserById, insertUser } from '../repositories/userRepository';
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

export const createUser = async (
  username: string,
  email: string,
  password: string,
): Promise<PublicUser> => {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await insertUser(username, email, passwordHash);
    return { id: user.id, name: user.username, email: user.email };
  } catch (error) {
    if (error instanceof DuplicateUserError) {
      throw error.field === 'username'
        ? new ApiError(409, 'USERNAME_ALREADY_TAKEN', 'Name is already in use.')
        : new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email is already in use.');
    }
    throw error;
  }
};
