"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL || '',
    adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin_kelo_secure_2026!',
    jwtSecret: process.env.JWT_SECRET || 'kelo_super_secret_jwt_key_2026_postgre_secure',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    groqApiKey: process.env.GROQ_API_KEY || '',
    cookieName: 'kelo_admin_token',
};
