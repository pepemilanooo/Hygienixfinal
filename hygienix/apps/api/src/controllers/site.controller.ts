import { Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { AppError } from '../middleware/errorHandler';
import { ok, created, paginate } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import type { AuthRequest } from '../middleware/authenticate';

const SITE_SELECT = {
  id: true, clientId: true, name: true, type: true, address: true, city: true, province: true,
  zip: true, lat: true, lng: true, localContactName: true, localContactPhone: true,
  criticalZones: true, operationalNotes: true, status: true, createdAt: true, updatedAt: true,
  client: { select: { id: true, businessName: true } },
  siteCard: { select: { id: true, version: true, baseImageUrl: true } },
  _count: { select: { interventions: true } },
};

export async function listSites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, search, clientId } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      deletedAt: null,
      ...(clientId && { clientId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(req.query.status && { status: req.query.status as string }),
    };

    const [total, sites] = await Promise.all([
      prisma.site.count({ where }),
      prisma.site.findMany({ where, select: SITE_SELECT, skip, take: Number(limit), orderBy: { name: 'asc' } }),
    ]);

    paginate(res, sites, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function createSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientId, ...siteData } = req.body;
    if (!clientId) throw new AppError(400, 'VALIDATION_ERROR', 'clientId richiesto');

    const client = await prisma.client.findFirst({ where: { id: clientId, deletedAt: null } });
    if (!client) throw new AppError(404, 'NOT_FOUND', 'Cliente non trovato');

    const site = await prisma.site.create({
      data: { clientId, ...siteData },
      select: SITE_SELECT,
    });

    // Crea cartellino vuoto automaticamente
    await prisma.siteCard.create({ data: { siteId: site.id } });

    await createAuditLog({ userId: req.user!.sub, action: 'SITE_CREATED', entityType: 'Site', entityId: site.id });
    created(res, site);
  } catch (err) {
    next(err);
  }
}

export async function getSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: SITE_SELECT,
    });
    if (!site) throw new AppError(404, 'NOT_FOUND', 'Sede non trovata');
    ok(res, site);
  } catch (err) {
    next(err);
  }
}

export async function updateSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.site.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Sede non trovata');

    const site = await prisma.site.update({
      where: { id: req.params.id },
      data: req.body,
      select: SITE_SELECT,
    });
    await createAuditLog({ userId: req.user!.sub, action: 'SITE_UPDATED', entityType: 'Site', entityId: site.id });
    ok(res, site);
  } catch (err) {
    next(err);
  }
}

export async function archiveSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.site.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Sede non trovata');

    await prisma.site.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await createAuditLog({ userId: req.user!.sub, action: 'SITE_ARCHIVED', entityType: 'Site', entityId: req.params.id });
    res.json({ success: true, data: { message: 'Sede archiviata' } });
  } catch (err) {
    next(err);
  }
}

export async function getSiteInterventions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { siteId: req.params.id, deletedAt: null };
    const [total, interventions] = await Promise.all([
      prisma.intervention.count({ where }),
      prisma.intervention.findMany({
        where, skip, take: Number(limit), orderBy: { scheduledAt: 'desc' },
        select: {
          id: true, serviceType: true, status: true, priority: true,
          scheduledAt: true, closedAt: true, reportPdfUrl: true,
          assignedTechnician: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);
    paginate(res, interventions, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}
