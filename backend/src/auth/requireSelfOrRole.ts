import { Request, Response, NextFunction } from 'express';

export function requireSelfOrRole(role: 'clinician'|'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (res.locals as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // clinicians/admins pass
    if (user.role === role || (role === 'clinician' && user.role === 'admin')) return next();

    // patient self-scope: require a patientId in route/query/body and it must match linkedPatientId
    const candidate =
      (req.params as any).patientId ||
      (req.query as any).patientId ||
      (req.body || {}).patientId;

    if (user.role === 'patient' && user.linkedPatientId && candidate && candidate === user.linkedPatientId) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}
