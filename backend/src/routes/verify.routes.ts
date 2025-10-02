import { Router } from 'express';
import { Certificate } from '../models/certificate.model';

const router = Router();

// GET /verify?code=ABCD-EFGH
router.get('/', async (req, res) => {
  const code = String(req.query.code || '').trim();
  if (!code) return res.status(400).json({ error: 'MissingCode' });

  const cert = await Certificate.findOne({ verifyCode: code }).lean();
  if (!cert) return res.status(404).json({ valid: false });

  // Do not expose PHI
  const maskedPatient = cert.patientId ? cert.patientId.replace(/.(?=.{3})/g, '*') : null;

  res.json({
    valid: cert.status === 'SIGNED',
    certificateId: cert.certificateId,
    type: cert.type,
    status: cert.status,
    issuedAt: cert.issuedAt ?? null,
    revokedAt: cert.revokedAt ?? null,
    patient: maskedPatient,
  });
});

export default router;
