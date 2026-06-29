import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

// Route modules
import authRoutes from './modules/auth/auth.routes';

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet()); // Sets X-Content-Type-Options, X-Frame-Options, etc.

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,           // allow cookies / auth headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,  // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS,    // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

// Stricter limiter for auth endpoints only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // only 10 login attempts per 15 min
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
});

app.use(limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // reject bodies over 10kb
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ── Health check (no auth, no rate limit) ────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', env: env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────────
const API_PREFIX = `/api/${env.API_VERSION}`;

app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
// Phase 1 — remaining routes mounted as we build them:
// app.use(`${API_PREFIX}/users`, usersRoutes);
// app.use(`${API_PREFIX}/doctors`, doctorsRoutes);
// app.use(`${API_PREFIX}/appointments`, appointmentsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

export default app;