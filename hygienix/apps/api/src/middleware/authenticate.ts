import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import type { JwtPayload, UserRole } from '@hygienix/types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token di autenticazione richiesto' } });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Token non valido o scaduto' } });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non autenticato' } });
      return;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Permessi insufficienti per questa operazione' } });
      return;
    }
    next();
  };
}

// Helper per verificare se il tecnico sta accedendo solo ai propri dati
export function isSelfOrAdmin(req: AuthRequest, resourceUserId: string): boolean {
  if (!req.user) return false;
  return req.user.role !== 'TECHNICIAN' || req.user.sub === resourceUserId;
}
