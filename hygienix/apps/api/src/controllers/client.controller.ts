import { Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { AppError } from '../middleware/errorHandler';
import { ok, created, paginate } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import type { AuthRequest } from '../middleware/authenticate';

const CLIENT_SELECT = {
  id: true, businessName: true, type: true, status: true,
  city: true, contactPhone: true, contactEmail: true, contactName: true,
  taxCode: true, vatNumber: true, address: true, province: true, zip: true, notes: true,
  createdAt: true, updatedAt: true,
  _count: { select: { sites: true, interventions: true } },
};

export async function listClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: 'insensitive' as const } },
          { contactName: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { contactEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(req.query.status && { status: req.query.status as string }),
      ...(req.query.type && { type: req.query.type as string }),
    };

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        select: CLIENT_SELECT,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    paginate(res, clients, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function createClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await prisma.client.create({
      data: { ...req.body, createdById: req.user!.sub },
      select: CLIENT_SELECT,
    });
    await createAuditLog({ userId: req.user!.sub, action: 'CLIENT_CREATED', entityType: 'Client', entityId: client.id });
    created(res, client);
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { ...CLIENT_SELECT, sites: { where: { deletedAt: null }, select: { id: true, name: true, city: true, status: true }, orderBy: { name: 'asc' } } },
    });
    if (!client) throw new AppError(404, 'NOT_FOUND', 'Cliente non trovato');
    ok(res, client);
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Cliente non trovato');

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
      select: CLIENT_SELECT,
    });
    await createAuditLog({ userId: req.user!.sub, action: 'CLIENT_UPDATED', entityType: 'Client', entityId: client.id });
    ok(res, client);
  } catch (err) {
    next(err);
  }
}

export async function archiveClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.client.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Cliente non trovato');

    await prisma.client.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await createAuditLog({ userId: req.user!.sub, action: 'CLIENT_ARCHIVED', entityType: 'Client', entityId: req.params.id });
    res.json({ success: true, data: { message: 'Cliente archiviato' } });
  } catch (err) {
    next(err);
  }
}

export async function getClientInterventions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { clientId: req.params.id, deletedAt: null };
    const [total, interventions] = await Promise.all([
      prisma.intervention.count({ where }),
      prisma.intervention.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true, serviceType: true, status: true, priority: true,
          scheduledAt: true, closedAt: true,
          site: { select: { id: true, name: true } },
          assignedTechnician: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    paginate(res, interventions, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function getClientSites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sites = await prisma.site.findMany({
      where: { clientId: req.params.id, deletedAt: null },
      select: {
        id: true, name: true, type: true, address: true, city: true, status: true,
        siteCard: { select: { id: true, version: true } },
        _count: { select: { interventions: true } },
      },
      orderBy: { name: 'asc' },
    });
    ok(res, sites);
  } catch (err) {
    next(err);
  }
}
