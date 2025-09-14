import { NextFunction, Request, Response } from 'express';
import { verifyToken } from './jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Prefer cookie; fallback to Authorization header
    const cookie = req.cookies?.token as string | undefined;
    const header = req.headers.authorization?.split(' ')[1];
    const token = cookie || header;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = verifyToken(token);
    (res.locals as any).user = payload; // { sub, username, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireRole(role: 'clinician'|'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (res.locals as any).user;
    if (!user || user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
