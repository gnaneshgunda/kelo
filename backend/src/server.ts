import { app } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { runSeeds } from './db/seed';

async function bootstrap() {
  try {
    // Automatically run migrations and seeds on startup
    await runMigrations();
    await runSeeds();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 KELO Backend Server running on port ${config.port}`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🔒 Admin Auth: Enabled (HttpOnly cookie + JWT)`);
      console.log(`🗄️  Database: PostgreSQL Engine Ready`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
