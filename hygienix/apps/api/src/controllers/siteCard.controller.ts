import { Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { AppError } from '../middleware/errorHandler';
import { ok, created } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import type { AuthRequest } from '../middleware/authenticate';

async function getSiteCardOrThrow(siteId: string) {
  const card = await prisma.siteCard.findFirst({
    where: { siteId },
    include: { points: { where: { deletedAt: null }, orderBy: { code: 'asc' } } },
  });
  if (!card) throw new AppError(404, 'NOT_FOUND', 'Cartellino non trovato per questa sede');
  return card;
}

// Tecnico può vedere solo il cartellino della sede del proprio intervento
async function technicianCanAccessSite(userId: string, siteId: string): Promise<boolean> {
  const count = await prisma.intervention.count({
    where: { siteId, assignedTechnicianId: userId, deletedAt: null, status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] } },
  });
  return count > 0;
}

export async function getSiteCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { siteId } = req.params;

    if (req.user!.role === 'TECHNICIAN') {
      const canAccess = await technicianCanAccessSite(req.user!.sub, siteId);
      if (!canAccess) throw new AppError(403, 'FORBIDDEN', 'Accesso non autorizzato a questa sede');
    }

    const card = await getSiteCardOrThrow(siteId);
    ok(res, card);
  } catch (err) {
    next(err);
  }
}

export async function createOrUpdateSiteCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { siteId } = req.params;
    const site = await prisma.site.findFirst({ where: { id: siteId, deletedAt: null } });
    if (!site) throw new AppError(404, 'NOT_FOUND', 'Sede non trovata');

    const existing = await prisma.siteCard.findFirst({ where: { siteId } });

    if (existing) {
      const updated = await prisma.siteCard.update({
        where: { siteId },
        data: { ...req.body, version: { increment: 1 } },
        include: { points: { where: { deletedAt: null } } },
      });
      ok(res, updated);
    } else {
      const card = await prisma.siteCard.create({
        data: { siteId, ...req.body },
        include: { points: true },
      });
      created(res, card);
    }
  } catch (err) {
    next(err);
  }
}

export async function updateSiteCard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await getSiteCardOrThrow(req.params.siteId);

    // Salva snapshot per versioning
    await prisma.siteCardRevision.create({
      data: {
        siteCardId: card.id,
        version: card.version,
        snapshot: JSON.parse(JSON.stringify(card)),
      },
    });

    const updated = await prisma.siteCard.update({
      where: { siteId: req.params.siteId },
      data: { ...req.body, version: { increment: 1 } },
      include: { points: { where: { deletedAt: null } } },
    });

    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function getSiteCardHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await prisma.siteCard.findFirst({ where: { siteId: req.params.siteId } });
    if (!card) throw new AppError(404, 'NOT_FOUND', 'Cartellino non trovato');

    const revisions = await prisma.siteCardRevision.findMany({
      where: { siteCardId: card.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    ok(res, revisions);
  } catch (err) {
    next(err);
  }
}

export async function getPoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { siteId } = req.params;

    if (req.user!.role === 'TECHNICIAN') {
      const canAccess = await technicianCanAccessSite(req.user!.sub, siteId);
      if (!canAccess) throw new AppError(403, 'FORBIDDEN', 'Accesso non autorizzato');
    }

    const card = await prisma.siteCard.findFirst({ where: { siteId } });
    if (!card) throw new AppError(404, 'NOT_FOUND', 'Cartellino non trovato');

    const points = await prisma.siteCardPoint.findMany({
      where: { siteCardId: card.id, deletedAt: null },
      orderBy: { code: 'asc' },
    });
    ok(res, points);
  } catch (err) {
    next(err);
  }
}

export async function createPoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await getSiteCardOrThrow(req.params.siteId);

    // Verifica codice univoco nel cartellino
    const existingCode = await prisma.siteCardPoint.findFirst({
      where: { siteCardId: card.id, code: req.body.code, deletedAt: null },
    });
    if (existingCode) throw new AppError(409, 'DUPLICATE', `Codice punto "${req.body.code}" già esistente in questo cartellino`);

    const point = await prisma.siteCardPoint.create({
      data: { siteCardId: card.id, ...req.body },
    });

    // Incrementa versione cartellino
    await prisma.siteCard.update({ where: { id: card.id }, data: { version: { increment: 1 } } });

    await createAuditLog({ userId: req.user!.sub, action: 'CARD_POINT_CREATED', entityType: 'SiteCardPoint', entityId: point.id });
    created(res, point);
  } catch (err) {
    next(err);
  }
}

export async function updatePoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const point = await prisma.siteCardPoint.findFirst({
      where: { id: req.params.pointId, deletedAt: null },
    });
    if (!point) throw new AppError(404, 'NOT_FOUND', 'Punto non trovato');

    const updated = await prisma.siteCardPoint.update({
      where: { id: req.params.pointId },
      data: req.body,
    });

    // Incrementa versione cartellino
    await prisma.siteCard.update({ where: { id: point.siteCardId }, data: { version: { increment: 1 } } });

    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deletePoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const point = await prisma.siteCardPoint.findFirst({ where: { id: req.params.pointId, deletedAt: null } });
    if (!point) throw new AppError(404, 'NOT_FOUND', 'Punto non trovato');

    await prisma.siteCardPoint.update({ where: { id: req.params.pointId }, data: { deletedAt: new Date() } });
    await createAuditLog({ userId: req.user!.sub, action: 'CARD_POINT_DELETED', entityType: 'SiteCardPoint', entityId: req.params.pointId });
    res.json({ success: true, data: { message: 'Punto eliminato' } });
  } catch (err) {
    next(err);
  }
}
