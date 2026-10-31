import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Pool } from 'pg';

require('dotenv').config();
const pool = require('../config/db.postgres') as Pool;

const run = async (): Promise<void> => {
  const migrationPath = resolve(process.cwd(), 'src/db/migrations/001_create_users.sql');
  const migration = await readFile(migrationPath, 'utf8');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('Database setup complete: users table is ready.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database setup failed.', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

void run().catch(async (error: unknown) => {
  console.error('Could not connect to PostgreSQL or load the users migration.', error);
  process.exitCode = 1;
  await pool.end();
});
