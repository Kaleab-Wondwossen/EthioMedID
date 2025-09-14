import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initMongo } from './db';
import patientRoutes from './routes/patient.routes';
import certificateRoutes from './routes/certificate.routes';
import authRoutes from './routes/auth.routes';
import { requireAuth } from './auth/requireAuth';

const app = express();

// CORS must allow credentials for cookie auth from Next.js dev server
app.use(cors({
  origin: ['http://localhost:3000'], // Next.js origin
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'express-api', ts: new Date().toISOString() }));

// auth
app.use('/auth', authRoutes);

// protected routes (require login)
app.use('/patients', requireAuth, patientRoutes);
app.use('/certificates', requireAuth, certificateRoutes);

// 404 + error handlers ... (keep what you already have)

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kaleabwondwossen12:rbACngaob5XyvJ9g@dastabasedb.rnu5m.mongodb.net/MedID?retryWrites=true&w=majority&appName=DastabaseDB ';

initMongo(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
});
