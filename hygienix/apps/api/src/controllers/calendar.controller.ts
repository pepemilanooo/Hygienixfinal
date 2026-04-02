import { Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { ok } from '../lib/response';
import type { AuthRequest } from '../middleware/authenticate';

const CALENDAR_SELECT = {
  id: true, serviceType: true, status: true, priority: true,
  scheduledAt: true, scheduledEndAt: true, startedAt: true, completedAt: true,
  client: { select: { id: true, businessName: true } },
  site: { select: { id: true, name: true, city: true } },
  assignedTechnician: { select: { id: true, firstName: true, lastName: true } },
};

export async function getCalendar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to, technicianId, status } = req.query as Record<string, string>;

    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1)); // inizio mese corrente
    const toDate = to ? new Date(to) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0)); // fine mese

    const where: Record<string, unknown> = {
      deletedAt: null,
      scheduledAt: { gte: fromDate, lte: toDate },
      ...(technicianId && { assignedTechnicianId: technicianId }),
      ...(status && { status }),
    };

    const interventions = await prisma.intervention.findMany({
      where,
      select: CALENDAR_SELECT,
      orderBy: { scheduledAt: 'asc' },
    });

    ok(res, interventions);
  } catch (err) {
    next(err);
  }
}

export async function getMyCalendar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as Record<string, string>;
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const toDate = to ? new Date(to) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

    const interventions = await prisma.intervention.findMany({
      where: {
        assignedTechnicianId: req.user!.sub,
        deletedAt: null,
        status: { notIn: ['ARCHIVED'] },
        scheduledAt: { gte: fromDate, lte: toDate },
      },
      select: CALENDAR_SELECT,
      orderBy: { scheduledAt: 'asc' },
    });

    ok(res, interventions);
  } catch (err) {
    next(err);
  }
}
