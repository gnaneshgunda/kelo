"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./index");
async function runMigrations() {
    console.log('[DB] Running database migrations...');
    const schemaPath = path_1.default.resolve(__dirname, 'schema.sql');
    const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf-8');
    try {
        await (0, index_1.exec)(schemaSql);
        // Ensure images column exists for events table in existing databases
        await (0, index_1.exec)(`ALTER TABLE events ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;`);
        console.log('[DB] Database migrations completed successfully.');
    }
    catch (err) {
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
