import express from 'express';
import cors from 'cors';
import { initMongo } from './db';
import patientRoutes from './routes/patient.routes';
import certificateRoutes from './routes/certificate.routes';

const app = express();
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

// health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'express-api', ts: new Date().toISOString() }));

// routes
app.use('/patients', patientRoutes);
app.use('/certificates', certificateRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'RouteNotFound' }));

// JSON error handler (invalid JSON body)
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return res.status(400).json({ error: 'InvalidJSON', message: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'ServerError' });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kaleabwondwossen12:rbACngaob5XyvJ9g@dastabasedb.rnu5m.mongodb.net/MedID?retryWrites=true&w=majority&appName=DastabaseDB ';

initMongo(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
});
