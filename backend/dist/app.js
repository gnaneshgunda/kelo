"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./config");
const auth_1 = require("./routes/auth");
const products_1 = require("./routes/products");
const orders_1 = require("./routes/orders");
const events_1 = require("./routes/events");
const polls_1 = require("./routes/polls");
const competitions_1 = require("./routes/competitions");
const settings_1 = require("./routes/settings");
const ai_1 = require("./routes/ai");
exports.app = (0, express_1.default)();
// CORS configuration supporting HttpOnly cookies and Bearer tokens
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    config_1.config.clientUrl,
].filter(Boolean);
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permissive in local dev
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-pqc-auth'],
}));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json());
// Request logging in development
if (!config_1.config.isProd) {
    exports.app.use((req, _res, next) => {
        console.log(`[HTTP] ${req.method} ${req.url}`);
        next();
    });
}
// ─── Route Mappings ─────────────────────────────────────────
// Health diagnostic
exports.app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'KELO Node.js/Express + PostgreSQL Backend',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString(),
    });
});
// Authentication
exports.app.use('/api/auth', auth_1.authRouter);
// Products & Catalog
exports.app.use('/api/products', products_1.productsRouter);
exports.app.use('/api/specials', (req, res, next) => {
    // Aliases for /api/specials -> /api/products/specials/list
    if (req.url === '/' || req.url === '') {
        req.url = '/specials/list';
    }
    else if (!req.url.startsWith('/specials')) {
        req.url = `/specials${req.url}`;
    }
    (0, products_1.productsRouter)(req, res, next);
});
exports.app.use('/api/stats', (req, res, next) => {
    req.url = '/store/stats';
    (0, products_1.productsRouter)(req, res, next);
});
// Orders & Checkout
exports.app.use('/api', orders_1.ordersRouter);
// Events
exports.app.use('/api/events', events_1.eventsRouter);
// Polls & Admin Voting
exports.app.use('/api/polls', polls_1.pollsRouter);
exports.app.use('/api/admin/polls', (req, res, next) => {
    req.url = `/admin${req.url}`;
    (0, polls_1.pollsRouter)(req, res, next);
});
// Painting Competition Applications
exports.app.use('/api/competitions', competitions_1.competitionsRouter);
// Website Content & Settings
exports.app.use('/api/settings', settings_1.settingsRouter);
// AI Assistant & Recommendations
exports.app.use('/api/ai', ai_1.aiRouter);
// 404 Handler
exports.app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});
// Error handling middleware
exports.app.use((err, _req, res, _next) => {
    console.error('[Unhandled Server Error]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
