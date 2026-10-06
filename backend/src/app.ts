import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { eventsRouter } from './routes/events';
import { pollsRouter } from './routes/polls';
import { competitionsRouter } from './routes/competitions';
import { settingsRouter } from './routes/settings';
import { aiRouter } from './routes/ai';

export const app = express();

// CORS configuration supporting HttpOnly cookies and Bearer tokens
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  config.clientUrl,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in local dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-pqc-auth'],
}));

app.use(cookieParser());
app.use(express.json());

// Request logging in development
if (!config.isProd) {
  app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// ─── Route Mappings ─────────────────────────────────────────

// Health diagnostic
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'KELO Node.js/Express + PostgreSQL Backend',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
  });
});

// Authentication
app.use('/api/auth', authRouter);

// Products & Catalog
app.use('/api/products', productsRouter);
app.use('/api/specials', (req, res, next) => {
  // Aliases for /api/specials -> /api/products/specials/list
  if (req.url === '/' || req.url === '') {
    req.url = '/specials/list';
  } else if (!req.url.startsWith('/specials')) {
    req.url = `/specials${req.url}`;
  }
  productsRouter(req, res, next);
});
app.use('/api/stats', (req, res, next) => {
  req.url = '/store/stats';
  productsRouter(req, res, next);
});

// Orders & Checkout
app.use('/api', ordersRouter);

// Events
app.use('/api/events', eventsRouter);

// Polls & Admin Voting
app.use('/api/polls', pollsRouter);
app.use('/api/admin/polls', (req, res, next) => {
  req.url = `/admin${req.url}`;
  pollsRouter(req, res, next);
});

// Painting Competition Applications
app.use('/api/competitions', competitionsRouter);

// Website Content & Settings
app.use('/api/settings', settingsRouter);

// AI Assistant & Recommendations
app.use('/api/ai', aiRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});
