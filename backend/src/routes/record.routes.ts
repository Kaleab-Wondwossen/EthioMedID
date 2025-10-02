import { Router } from 'express';
import { z } from 'zod';
import { Record } from '../models/record.model';
import { Patient } from '../models/patient.model';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../utils/validate';
import { schemaByType, RecordType } from '../utils/recordSchemas';
import { requireAuth, requireRole } from '../auth/requireAuth';
import { requireSelfOrRole } from '../auth/requireSelfOrRole';

const router = Router();

// Query: list by patient, type, tags, date range
const qSchema = z.object({
  patientId: z.string().min(1),
  type: z.string().optional(),         // one type
  tag: z.string().optional(),          // single tag
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.string().transform(Number).pipe(z.number().int().gte(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().gte(1).lte(100)).optional(),
});

const idParam = z.object({ recordId: z.string().min(1) });

// Create/Update common body
const createBody = z.object({
  recordId: z.string().min(1),
  patientId: z.string().min(1),
  type: z.custom<RecordType>((v) => typeof v === 'string' && v in schemaByType, 'invalid type'),
  effectiveAt: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  payload: z.unknown(), // validated dynamically
});

const updateBody = z.object({
  payload: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
  effectiveAt: z.coerce.date().optional(),
});

// GET /records?patientId=...&type=...&page=1&limit=20
router.get('/', requireAuth, requireSelfOrRole('clinician'), validate(qSchema, 'query'), asyncHandler(async (_req, res) => {
  const qv = (res.locals as any).__validated.query as z.infer<typeof qSchema>;
  const page = qv.page ?? 1;
  const limit = qv.limit ?? 20;

  const query: any = { patientId: qv.patientId, deletedAt: null };
  if (qv.type) query.type = qv.type;
  if (qv.tag) query.tags = qv.tag;
  if (qv.from || qv.to) {
    query.effectiveAt = {};
    if (qv.from) (query.effectiveAt as any).$gte = new Date(qv.from);
    if (qv.to) (query.effectiveAt as any).$lte = new Date(qv.to);
  }

  const [items, total] = await Promise.all([
    Record.find(query).sort({ effectiveAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Record.countDocuments(query),
  ]);

  res.json({ items, total, page, limit });
}));

// GET /records/:recordId
router.get('/:recordId', validate(idParam, 'params'), asyncHandler(async (_req, res) => {
  const { recordId } = (res.locals as any).__validated.params;
  const doc = await Record.findOne({ recordId, deletedAt: null }).lean();
  if (!doc) return res.status(404).json({ error: 'NotFound' });
  res.json(doc);
}));

// POST /records   (clinician)
router.post('/',
  requireRole('clinician'),
  validate(createBody),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createBody>;

    // Ensure patient exists
    const patient = await Patient.findOne({ patientId: body.patientId }).lean();
    if (!patient) return res.status(400).json({ error: 'PatientNotFound' });

    // Validate payload by type
    const schema = schemaByType[body.type as RecordType];
    const parsed = schema.safeParse(body.payload);
    if (!parsed.success) {
      return res.status(400).json({ error: 'ValidationError', details: parsed.error.flatten() });
    }

    const user = (res.locals as any).user;
    const doc = await Record.create({
      ...body,
      payload: parsed.data,
      createdBy: { userId: user.sub, username: user.username, role: user.role },
      deletedAt: null,
      revision: 1,
    });
    res.status(201).json(doc);
  })
);

// PUT /records/:recordId  (clinician)
router.put('/:recordId',
  requireRole('clinician'),
  validate(idParam, 'params'),
  validate(updateBody),
  asyncHandler(async (req, res) => {
    const { recordId } = (res.locals as any).__validated.params;
    const update = req.body as z.infer<typeof updateBody>;

    // validate payload if present
    if (update.payload !== undefined) {
      const existing = await Record.findOne({ recordId, deletedAt: null }).lean();
      if (!existing) return res.status(404).json({ error: 'NotFound' });
      const schema = schemaByType[existing.type as RecordType];
      const parsed = schema.safeParse(update.payload);
      if (!parsed.success) {
        return res.status(400).json({ error: 'ValidationError', details: parsed.error.flatten() });
      }
      (update as any).payload = parsed.data;
    }

    const doc = await Record.findOneAndUpdate(
      { recordId, deletedAt: null },
      { ...update, $inc: { revision: 1 } },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: 'NotFound' });
    res.json(doc);
  })
);

// DELETE /records/:recordId  (soft delete)
router.delete('/:recordId',
  requireRole('clinician'),
  validate(idParam, 'params'),
  asyncHandler(async (_req, res) => {
    const { recordId } = (res.locals as any).__validated.params;
    const doc = await Record.findOneAndUpdate(
      { recordId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'NotFound' });
    res.json({ ok: true });
  })
);

export default router;
