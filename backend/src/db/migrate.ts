import fs from 'fs';
import path from 'path';
import { exec } from './index';

export async function runMigrations() {
  console.log('[DB] Running database migrations...');
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await exec(schemaSql);
    // Ensure images column exists for events table in existing databases
    await exec(`ALTER TABLE events ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;`);
    console.log('[DB] Database migrations completed successfully.');
  } catch (err) {
    console.error('[DB] Migration failed:', err);
    throw err;
  }
}

if (require.main === module || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
