import type { Pool } from 'pg';
import { randomUUID } from 'crypto';

const pool = require('../config/db.postgres') as Pool;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
}

export const findUserByEmail = async (email: string): Promise<AuthUser | null> => {
  const result = await pool.query<AuthUser>(
    `SELECT id, username, email, "passwordHash" AS password_hash
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email],
  );

  return result.rows[0] ?? null;
};

export type PublicUserRecord = Pick<AuthUser, 'id' | 'username' | 'email'>;

export const findUserById = async (id: string): Promise<PublicUserRecord | null> => {
  const result = await pool.query<PublicUserRecord>(
    `SELECT id, username, email
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
};

export type DuplicateField = 'email' | 'username';

export class DuplicateUserError extends Error {
  constructor(public readonly field: DuplicateField) {
    super(`Duplicate ${field}`);
    this.name = 'DuplicateUserError';
  }
}

// Inserts a user. Only unique violations (23505) become DuplicateUserError; other errors propagate.
export const insertUser = async (
  username: string,
  email: string,
  passwordHash: string,
): Promise<AuthUser> => {
  try {
    const result = await pool.query<AuthUser>(
      `INSERT INTO users (id, username, email, "passwordHash", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, username, email, "passwordHash" AS password_hash`,
      [randomUUID(), username, email, passwordHash],
    );
    return result.rows[0];
  } catch (error) {
    const err = error as { code?: string; constraint?: string };
    if (err.code === '23505') {
      throw new DuplicateUserError(err.constraint?.includes('username') ? 'username' : 'email');
    }
    throw error;
  }
};
