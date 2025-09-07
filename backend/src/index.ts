import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'express-api', timestamp: new Date().toISOString() });
});

// tiny in-memory patients store (we'll replace with Mongo later)
const patients: { id: string; name: string }[] = [
  { id: 'p1', name: 'Abel' },
  { id: 'p2', name: 'Sara' }
];

app.get('/patients', (_req, res) => res.json(patients));
app.post('/patients', (req, res) => {
  const { id, name } = req.body || {};
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  patients.push({ id, name });
  res.status(201).json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
