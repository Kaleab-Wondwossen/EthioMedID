// backend/src/index.ts

// Load .env first
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { initMongo } from './db';
import patientRoutes from './routes/patient.routes';
import certificateRoutes from './routes/certificate.routes';
import authRoutes from './routes/auth.routes';
import recordRoutes from './routes/record.routes';
import { requireAuth } from './auth/requireAuth';

const app = express();

// CORS must allow credentials for cookie auth from Next.js dev server
app.use(
  cors({
    origin: ['http://localhost:3000'], // Next.js origin
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Health check route
app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'express-api',
    ts: new Date().toISOString(),
  })
);

// Auth routes
app.use('/auth', authRoutes);

// Protected routes (require login)
app.use('/patients', requireAuth, patientRoutes);
app.use('/certificates', requireAuth, certificateRoutes);
app.use('/records', requireAuth, recordRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'RouteNotFound' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'InternalServerError' });
});

// Config
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not set in .env');
  process.exit(1);
}

// Start server after DB is ready
initMongo(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
});
