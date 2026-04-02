import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@hygienix/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_TOKEN_EXPIRES_MS } from '../config/jwt';
import { AppError } from '../middleware/errorHandler';
import { ok } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import type { AuthRequest } from '../middleware/authenticate';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email o password non corretti');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email o password non corretti');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshTokenValue = signRefreshToken(payload);

    // Salva refresh token nel DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      },
    });

    // Aggiorna lastLoginAt
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await createAuditLog({ userId: user.id, action: 'AUTH_LOGIN', ipAddress: req.ip });

    ok(res, {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError(401, 'TOKEN_INVALID', 'Refresh token non valido o scaduto');
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!storedToken || !storedToken.user.isActive) {
      throw new AppError(401, 'TOKEN_REVOKED', 'Sessione non valida. Effettua di nuovo il login.');
    }

    // Ruota il refresh token (revoca vecchio, crea nuovo)
    await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });

    const newPayload = { sub: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      },
    });

    ok(res, { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 15 * 60 });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await createAuditLog({ userId: req.user?.sub, action: 'AUTH_LOGOUT' });
    res.json({ success: true, data: { message: 'Logout effettuato' } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user!.sub, deletedAt: null },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, avatarUrl: true, isActive: true, lastLoginAt: true, createdAt: true,
      },
    });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Utente non trovato');
    ok(res, { ...user, fullName: `${user.firstName} ${user.lastName}` });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, phone, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findFirst({ where: { id: req.user!.sub, deletedAt: null } });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Utente non trovato');

    const updateData: Record<string, unknown> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    if (newPassword) {
      if (!currentPassword) throw new AppError(400, 'VALIDATION_ERROR', 'Password attuale richiesta');
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) throw new AppError(400, 'INVALID_PASSWORD', 'Password attuale non corretta');
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.sub },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatarUrl: true },
    });

    ok(res, updated);
  } catch (err) {
    next(err);
  }
}
