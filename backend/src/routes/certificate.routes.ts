import { Router } from 'express';
import { z } from 'zod';
import { Certificate } from '../models/certificate.model';
import { Patient } from '../models/patient.model';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../utils/validate';
import { requireAuth } from '../auth/requireAuth';
import { requireSelfOrRole } from '../auth/requireSelfOrRole';
import { makeVerifyCode } from '../utils/codes';
import { buildVerifyUrl } from '../utils/urls';

const router = Router();

const listQ = z.object({
  patientId: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().gte(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().gte(1).lte(100)).optional(),
});

const createBody = z.object({
  certificateId: z.string().min(1),
  patientId: z.string().min(1),
  type: z.enum(['DrivingLicenceMedical', 'ImmigrationMedical']),
});

const idParam = z.object({ certificateId: z.string().min(1) });

const updateBody = z.object({
  status: z.enum(['DRAFT', 'SIGNED', 'REVOKED']).optional(),
  url: z.string().url().optional(),
  hash: z.string().optional(),
  issuedAt: z.coerce.date().optional(),
  revokedAt: z.coerce.date().optional(),
});

// GET /certificates → paginated list
router.get(
  '/',
  requireAuth,
  requireSelfOrRole('clinician'),
  validate(listQ, 'query'),
  asyncHandler(async (_req, res) => {
    const qv = (res.locals as any).__validated?.query as {
      patientId?: string;
      page?: number;
      limit?: number;
    };

    const page = qv?.page ?? 1;
    const limit = qv?.limit ?? 5;

    const q: any = qv?.patientId ? { patientId: qv.patientId } : {};

    const [items, total] = await Promise.all([
      Certificate.find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Certificate.countDocuments(q),
    ]);

    res.json({ items, total, page, limit });
  })
);


// GET /certificates?patientId=&page=&limit=
router.get('/', validate(listQ, 'query'), asyncHandler(async (req, res) => {
  const { patientId, page = 1, limit = 20 } = req.query as any;
  const q: any = patientId ? { patientId } : {};
  const [items, total] = await Promise.all([
    Certificate.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Certificate.countDocuments(q),
  ]);
  res.json({ items, total, page, limit });
}));

// GET /patients/:patientId/certificates (alias)
router.get('/by-patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params as any;
  const items = await Certificate.find({ patientId }).sort({ createdAt: -1 }).lean();
  res.json(items);
}));

// GET /certificates/:certificateId
router.get('/:certificateId', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const { certificateId } = req.params as any;
  const doc = await Certificate.findOne({ certificateId }).lean();
  if (!doc) return res.status(404).json({ error: 'NotFound' });
  res.json(doc);
}));

// POST /certificates
router.post('/', validate(createBody), asyncHandler(async (req, res) => {
  // verify patient exists
  const patient = await Patient.findOne({ patientId: req.body.patientId }).lean();
  if (!patient) return res.status(400).json({ error: 'PatientNotFound' });

  const doc = await Certificate.create({ ...req.body, status: 'DRAFT' });
  // If no verify code, generate one
  if (!doc.verifyCode) {
    const code = makeVerifyCode();
    const qr = buildVerifyUrl(code);
    doc.verifyCode = code;
    doc.qrPayload = qr;
    await doc.save();
  }
  res.status(201).json(doc);

  res.status(201).json(doc);
}));

// PUT /certificates/:certificateId
router.put('/:certificateId', validate(idParam, 'params'), validate(updateBody), asyncHandler(async (req, res) => {
  const { certificateId } = req.params as any;
  const update = { ...req.body };

  // auto-set times if status transitions
  if (update.status === 'SIGNED' && !update.issuedAt) update.issuedAt = new Date();
  if (update.status === 'REVOKED' && !update.revokedAt) update.revokedAt = new Date();
  // If signing for the first time, ensure code exists
  if (req.body.status === 'SIGNED') {
    const existing = await Certificate.findOne({ certificateId }).lean();
    if (existing && !existing.verifyCode) {
      update.verifyCode = makeVerifyCode();
      update.qrPayload = buildVerifyUrl(update.verifyCode);
    }
  }

  const doc = await Certificate.findOneAndUpdate({ certificateId }, update, { new: true }).lean();
  if (!doc) return res.status(404).json({ error: 'NotFound' });
  res.json(doc);
}));

// DELETE /certificates/:certificateId
router.delete('/:certificateId', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const { certificateId } = req.params as any;
  const r = await Certificate.deleteOne({ certificateId });
  if (r.deletedCount === 0) return res.status(404).json({ error: 'NotFound' });
  res.json({ ok: true });
}));

export default router;
