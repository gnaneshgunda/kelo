import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin_kelo_secure_2026!',
  jwtSecret: process.env.JWT_SECRET || 'kelo_super_secret_jwt_key_2026_postgre_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  groqApiKey: process.env.GROQ_API_KEY || '',
  gmailUser: process.env.GMAIL_USER || '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
  cookieName: 'kelo_admin_token',
};
