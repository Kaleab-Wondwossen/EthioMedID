import { Router } from 'express';
import { Certificate } from '../models/certificate.model';
const router = Router();

// GET /verify?code=ABCD-EFGH
router.get('/', async (req, res) => {
  const code = String(req.query.code || '').trim();
  if (!code) return res.status(400).json({ error: 'MissingCode' });

  const cert = await Certificate.findOne({ verifyCode: code }).lean();
  if (!cert) return res.status(404).json({ valid: false });

  // minimal info; do not leak PHI
  res.json({
    valid: cert.status === 'SIGNED',
    certificateId: cert.certificateId,
    type: cert.type,
    status: cert.status,
    issuedAt: cert.issuedAt,
    revokedAt: cert.revokedAt ?? null,
    patientMasked: cert.patientId.replace(/.(?=.{3})/g, '*') // mask
  });
});

export default router;
