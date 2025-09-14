import { Router } from 'express';
import { z } from 'zod';
import { Patient } from '../models/patient.model';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../utils/validate';

const router = Router();

const qSchema = z.object({
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().gte(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().gte(1).lte(100)).optional(),
});

const createSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  dob: z.coerce.date().optional(),
  sex: z.enum(['male','female','other']).optional(),
});

const updateSchema = createSchema.partial();

const idParam = z.object({ patientId: z.string().min(1) });

// GET /patients?search=&page=&limit=
router.get('/', validate(qSchema, 'query'), asyncHandler(async (req, res) => {
  const qv = (res.locals as any).__validated?.query as { search?: string; page?: number; limit?: number } | undefined;
  const search = qv?.search;
  const page   = qv?.page  ?? 1;
  const limit  = qv?.limit ?? 5;

  const q: any = search ? { name: { $regex: search, $options: 'i' } } : {};
  const [items, total] = await Promise.all([
    Patient.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
    Patient.countDocuments(q),
  ]);
  res.json({ items, total, page, limit });
}));

// GET /patients/:patientId
router.get('/:patientId', validate(idParam, 'params'), asyncHandler(async (_req, res) => {
  const { patientId } = (res.locals as any).__validated.params as { patientId: string };
  const doc = await Patient.findOne({ patientId }).lean();
  if (!doc) return res.status(404).json({ error: 'NotFound' });
  res.json(doc);
}));


// POST /patients
router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const doc = await Patient.create(req.body);
  res.status(201).json(doc);
}));

// PUT /patients/:patientId
router.put('/:patientId', validate(idParam, 'params'), validate(updateSchema), asyncHandler(async (req, res) => {
  const { patientId } = req.params as any;
  const doc = await Patient.findOneAndUpdate({ patientId }, req.body, { new: true }).lean();
  if (!doc) return res.status(404).json({ error: 'NotFound' });
  res.json(doc);
}));

// DELETE /patients/:patientId
router.delete('/:patientId', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const { patientId } = req.params as any;
  const r = await Patient.deleteOne({ patientId });
  if (r.deletedCount === 0) return res.status(404).json({ error: 'NotFound' });
  res.json({ ok: true });
}));

export default router;
