import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Pool } from 'pg';

require('dotenv').config();
const pool = require('../config/db.postgres') as Pool;

const run = async (): Promise<void> => {
  const migrationsDirectory = resolve(process.cwd(), 'src/db/migrations');
  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const file of files) {
      const result = await client.query(
        'SELECT filename FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`Skipping already completed migration: ${file}`);
        continue;
      }

      const migrationPath = resolve(migrationsDirectory, file);
      const migration = await readFile(migrationPath, 'utf8');
      
      await client.query('BEGIN');
      try {
        await client.query(migration);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Migration completed: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('Database setup complete.');
  } catch (error) {
    console.error('Database setup failed.', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};


void run().catch(async (error: unknown) => {
  console.error('Could not connect to PostgreSQL or load migrations.', error);
  process.exitCode = 1;
  await pool.end();
});
