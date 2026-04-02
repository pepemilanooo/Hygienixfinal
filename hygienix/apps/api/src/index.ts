import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import siteRoutes from './routes/site.routes';
import siteCardRoutes from './routes/siteCard.routes';
import interventionRoutes from './routes/intervention.routes';
import calendarRoutes from './routes/calendar.routes';
import productRoutes from './routes/product.routes';
import analyticsRoutes from './routes/analytics.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Troppe richieste. Riprova tra qualche minuto.' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Troppi tentativi di login. Riprova tra 15 minuti.' } },
});

app.use('/api/v1', limiter);
app.use('/api/v1/auth/login', authLimiter);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
const api = '/api/v1';

app.use(`${api}/auth`, authRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/clients`, clientRoutes);
app.use(`${api}/sites`, siteRoutes);
app.use(`${api}/sites`, siteCardRoutes);
app.use(`${api}/interventions`, interventionRoutes);
app.use(`${api}/calendar`, calendarRoutes);
app.use(`${api}/products`, productRoutes);
app.use(`${api}/analytics`, analyticsRoutes);
app.use(`${api}/upload`, uploadRoutes);

// ─── ERROR HANDLERS ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Hygienix API running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

export default app;
