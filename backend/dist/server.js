"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const migrate_1 = require("./db/migrate");
const seed_1 = require("./db/seed");
async function bootstrap() {
    try {
        // Automatically run migrations and seeds on startup
        await (0, migrate_1.runMigrations)();
        await (0, seed_1.runSeeds)();
        app_1.app.listen(config_1.config.port, () => {
            console.log(`=======================================================`);
            console.log(`🚀 KELO Backend Server running on port ${config_1.config.port}`);
            console.log(`📡 URL: http://localhost:${config_1.config.port}`);
            console.log(`🔒 Admin Auth: Enabled (HttpOnly cookie + JWT)`);
            console.log(`🗄️  Database: PostgreSQL Engine Ready`);
            console.log(`=======================================================`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
bootstrap();
