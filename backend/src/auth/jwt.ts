import * as jwt from 'jsonwebtoken';

const SECRET: jwt.Secret = process.env.JWT_SECRET ?? 'dev-secret';
const EXPIRES_IN: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRES as any) ?? '1d';

export type AppJwtPayload = {
  sub: string;
  username: string;
  role: 'clinician' | 'admin' | 'patient';
  linkedPatientId?: string;  // <— add this
};

export function signToken(p: AppJwtPayload): string {
  return jwt.sign(p, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): AppJwtPayload {
  return jwt.verify(token, SECRET) as AppJwtPayload;
}
