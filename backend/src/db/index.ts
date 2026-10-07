import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

export interface DbResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface IDatabase {
  query<T = any>(sql: string, params?: any[]): Promise<DbResult<T>>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

class PostgresPoolDb implements IDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<DbResult<T>> {
    const res = await this.pool.query(sql, params);
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? res.rows.length,
    };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PGliteDb implements IDatabase {
  private pglite: PGlite;

  constructor(dataDir: string) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.pglite = new PGlite(dataDir);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<DbResult<T>> {
    const res = await this.pglite.query(sql, params);
    return {
      rows: (res.rows || []) as T[],
      rowCount: res.rows?.length || 0,
    };
  }

  async exec(sql: string): Promise<void> {
    await this.pglite.exec(sql);
  }

  async close(): Promise<void> {
    await this.pglite.close();
  }
}

let dbInstance: IDatabase | null = null;

export function getDb(): IDatabase {
  if (!dbInstance) {
    if (config.databaseUrl && config.databaseUrl.trim() !== '') {
      console.log('[DB] Connecting to PostgreSQL via connection pool...');
      dbInstance = new PostgresPoolDb(config.databaseUrl);
    } else {
      const dataDir = path.resolve(__dirname, '../../data/pgdata');
      console.log(`[DB] Using embedded PostgreSQL engine at ${dataDir}...`);
      dbInstance = new PGliteDb(dataDir);
    }
  }
  return dbInstance;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<DbResult<T>> {
  const db = getDb();
  return db.query<T>(sql, params);
}

export async function exec(sql: string): Promise<void> {
  const db = getDb();
  return db.exec(sql);
}
