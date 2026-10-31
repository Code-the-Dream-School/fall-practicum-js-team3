import jwt from 'jsonwebtoken';
import type { AuthUser } from '../repositories/userRepository';

export const ACCESS_TOKEN_TTL = '15m';

export const createAccessToken = (user: AuthUser): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }

  return jwt.sign(
    { email: user.email },
    secret,
    { subject: String(user.id), expiresIn: ACCESS_TOKEN_TTL },
  );
};
