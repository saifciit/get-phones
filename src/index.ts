import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import env from './config/env';

import authRoutes   from './routes/auth.routes';
import adsRoutes    from './routes/ads.routes';
import usersRoutes  from './routes/users.routes';
import fileRoutes   from './routes/file.routes';
import metaRoutes   from './routes/meta.routes';

const app = express();

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      [env.FRONTEND_URL, '*'],   // '*' allows Flutter mobile; restrict for web
  credentials: true,
}));

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── GLOBAL RATE LIMIT ────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { error: 'rate_limit_exceeded', message: 'Too many requests, please try again later.' },
}));

// ─── AUTH RATE LIMIT (stricter) ───────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      10,
  message:  { error: 'rate_limit_exceeded', message: 'Too many auth attempts, slow down.' },
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/ads',    adsRoutes);
app.use('/api/users',  usersRoutes);
app.use('/api/files',  fileRoutes);
app.use('/api/meta',   metaRoutes);

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'not_found', message: 'Route not found.' })
);

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error:   err.code    || 'server_error',
    message: err.message || 'Internal server error.',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀  EasyPhones API → http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

export default app;
