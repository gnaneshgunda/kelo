"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.query = query;
exports.exec = exec;
const pg_1 = require("pg");
const pglite_1 = require("@electric-sql/pglite");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
class PostgresPoolDb {
    pool;
    constructor(connectionString) {
        this.pool = new pg_1.Pool({ connectionString });
    }
    async query(sql, params = []) {
        const res = await this.pool.query(sql, params);
        return {
            rows: res.rows,
            rowCount: res.rowCount ?? res.rows.length,
        };
    }
    async exec(sql) {
        await this.pool.query(sql);
    }
    async close() {
        await this.pool.end();
    }
}
class PGliteDb {
    pglite;
    constructor(dataDir) {
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        this.pglite = new pglite_1.PGlite(dataDir);
    }
    async query(sql, params = []) {
        const res = await this.pglite.query(sql, params);
        return {
            rows: (res.rows || []),
            rowCount: res.rows?.length || 0,
        };
    }
    async exec(sql) {
        await this.pglite.exec(sql);
    }
    async close() {
        await this.pglite.close();
    }
}
let dbInstance = null;
function getDb() {
    if (!dbInstance) {
        if (config_1.config.databaseUrl && config_1.config.databaseUrl.trim() !== '') {
            console.log('[DB] Connecting to PostgreSQL via connection pool...');
            dbInstance = new PostgresPoolDb(config_1.config.databaseUrl);
        }
        else {
            const dataDir = path_1.default.resolve(__dirname, '../../data/pgdata');
            console.log(`[DB] Using embedded PostgreSQL engine at ${dataDir}...`);
            dbInstance = new PGliteDb(dataDir);
        }
    }
    return dbInstance;
}
async function query(sql, params = []) {
    const db = getDb();
    return db.query(sql, params);
}
async function exec(sql) {
    const db = getDb();
    return db.exec(sql);
}
