import type { Pool } from 'pg';

const pool = require('../config/db.postgres') as Pool;

export interface AuthUser {
  id: string;
  username: string | null;
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
