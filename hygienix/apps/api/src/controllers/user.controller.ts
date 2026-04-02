import { Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@hygienix/database';
import { AppError } from '../middleware/errorHandler';
import { ok, created, paginate } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import type { AuthRequest } from '../middleware/authenticate';

const USER_SELECT = {
  id: true, email: true, firstName: true, lastName: true, role: true,
  phone: true, avatarUrl: true, isActive: true, lastLoginAt: true, createdAt: true,
};

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, search, role } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(search && { OR: [{ firstName: { contains: search, mode: 'insensitive' as const } }, { lastName: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }),
    };
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, select: USER_SELECT, skip, take: Number(limit), orderBy: { lastName: 'asc' } }),
    ]);
    paginate(res, users, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password, ...rest } = req.body;
    const existing = await prisma.user.findFirst({ where: { email: rest.email.toLowerCase() } });
    if (existing) throw new AppError(409, 'DUPLICATE', 'Email già in uso');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { ...rest, email: rest.email.toLowerCase(), passwordHash }, select: USER_SELECT });
    await createAuditLog({ userId: req.user!.sub, action: 'USER_CREATED', entityType: 'User', entityId: user.id });
    created(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null }, select: USER_SELECT });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Utente non trovato');
    ok(res, { ...user, fullName: `${user.firstName} ${user.lastName}` });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Utente non trovato');
    const { password, ...rest } = req.body;
    const updateData: Record<string, unknown> = { ...rest };
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData, select: USER_SELECT });
    await createAuditLog({ userId: req.user!.sub, action: 'USER_UPDATED', entityType: 'User', entityId: user.id });
    ok(res, user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.user!.sub) throw new AppError(400, 'VALIDATION_ERROR', 'Non puoi eliminare il tuo stesso account');
    const existing = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Utente non trovato');
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
    await createAuditLog({ userId: req.user!.sub, action: 'USER_DELETED', entityType: 'User', entityId: req.params.id });
    res.json({ success: true, data: { message: 'Utente eliminato' } });
  } catch (err) {
    next(err);
  }
}
