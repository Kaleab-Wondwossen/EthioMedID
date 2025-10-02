import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Patient } from '../models/patient.model';
import { signToken } from '../auth/jwt';
import { validate } from '../utils/validate';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import { makePatientId } from '../utils/id';
import { requireAuth } from '../auth/requireAuth';

const router = Router();

const registerBody = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['clinician','admin']).optional() // optional; default clinician
});

const loginBody = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
const patientRegisterBody = z.object({
  // login credentials
  username: z.string().min(3),          // email or phone
  password: z.string().min(6),

  // patient profile (minimal)
  name: z.string().min(1),
  phone: z.string().min(5).optional(),
  dob: z.coerce.date().optional(),
  sex: z.enum(['male','female','other']).optional()
});


const cookieOpts = {
  httpOnly: true,
  secure: false,        // set true in production (HTTPS)
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
};

// POST /auth/register  (for now: open; later lock to admins)
router.post('/register', validate(registerBody), asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ error: 'UsernameTaken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash, role: role || 'clinician' });
  res.status(201).json({ username: user.username, role: user.role, createdAt: user.createdAt });
}));

// POST /auth/login
// backend/src/routes/auth.routes.ts
router.post('/login', validate(loginBody), asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'InvalidCredentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'InvalidCredentials' });

  if (user.role !== 'clinician' && user.role !== 'admin') {
    return res.status(403).json({ error: 'InvalidRole' });
  }
  const token = signToken({ sub: String(user._id), username: user.username, role: user.role as 'clinician' | 'admin' });

  // keep cookie (works in Insomnia etc.)
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true in prod/HTTPS
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });

  // ⬅︎ NEW: also return token so the web app can use Authorization header
  res.json({ ok: true, username: user.username, role: user.role, token });
}));


// POST /auth/register-patient  (public self-registration)
router.post('/register-patient', validate(patientRegisterBody), asyncHandler(async (req, res) => {
  const { username, password, name, phone, dob, sex } = req.body as z.infer<typeof patientRegisterBody>;

  // Uniqueness check on username
  const exists = await User.findOne({ username }).lean();
  if (exists) return res.status(400).json({ error: 'UsernameTaken' });

  // Start a transaction so Patient & User are always in sync
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate a new patientId and create Patient
    const patientId = makePatientId();
    await Patient.create([{
      patientId, name, phone, dob, sex
    }], { session });

    // Hash password and create User linked to the patient
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create([{
      username,
      passwordHash,
      role: 'patient',
      linkedPatientId: patientId
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Issue JWT (include linkedPatientId in payload)
    const token = signToken({
      sub: String(user[0]._id),
      username,
      role: 'patient',
      // @ts-ignore (add field in your AppJwtPayload type)
      linkedPatientId: patientId
    } as any);

    res.cookie('token', token, cookieOpts);
    return res.status(201).json({
      ok: true,
      token,
      user: { username, role: 'patient', linkedPatientId: patientId },
      patient: { patientId, name, phone, dob, sex }
    });

  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();

    // Handle possible dup keys (rare with generated IDs)
    if (e?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate', details: e.message });
    }
    throw e;
  }
}));

// GET /auth/me
router.get('/me', requireAuth, asyncHandler(async (_req, res) => {
  const user = (res.locals as any).user;
  res.json(user);
}));

// POST /auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: 0 });
  res.json({ ok: true });
});

export default router;
