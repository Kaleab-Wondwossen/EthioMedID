import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { signToken } from '../auth/jwt';
import { validate } from '../utils/validate';
import { asyncHandler } from '../utils/asyncHandler';
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

const cookieOpts = {
  httpOnly: true,
  secure: false,        // set true in production with HTTPS
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

  const token = signToken({ sub: String(user._id), username: user.username, role: user.role });

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
