import type { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const pool = require("../config/db.postgres") as Pool;

export interface AuthUser {
  id: string;
  username: string | null;
  email: string;
  password_hash: string;
}

export const findUserByEmail = async (
  email: string
): Promise<AuthUser | null> => {
  const result = await pool.query<AuthUser>(
    `SELECT id, username, email, "passwordHash" AS password_hash
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email]
  );

  return result.rows[0] ?? null;
};

export const insertUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthUser | null> => {
  try {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = randomUUID();
    const result = await pool.query<AuthUser>(
      `INSERT INTO users (id, username, email, "passwordHash")
			VALUES ($1, $2, $3, $4)
			RETURNING id, username, email, "passwordHash"`,
      [id, username, email, passwordHash]
    );

    return result.rows[0];
  } catch (error) {
    return null;
  }
};
