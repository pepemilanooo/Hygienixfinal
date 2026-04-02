import { Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { ok } from '../lib/response';
import type { AuthRequest } from '../middleware/authenticate';

export async function getOverview(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      interventionsToday,
      interventionsOpen,
      interventionsCompletedThisMonth,
      activeTechnicians,
      activeClients,
      interventionsToSchedule,
    ] = await Promise.all([
      prisma.intervention.count({ where: { scheduledAt: { gte: todayStart, lte: todayEnd }, deletedAt: null, status: { notIn: ['ARCHIVED', 'CLOSED'] } } }),
      prisma.intervention.count({ where: { deletedAt: null, status: { in: ['PLANNED', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.intervention.count({ where: { deletedAt: null, status: { in: ['COMPLETED', 'CLOSED'] }, closedAt: { gte: monthStart } } }),
      prisma.user.count({ where: { role: 'TECHNICIAN', isActive: true, deletedAt: null } }),
      prisma.client.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.intervention.count({ where: { deletedAt: null, status: 'PLANNED', assignedTechnicianId: null } }),
    ]);

    ok(res, {
      interventionsToday,
      interventionsOpen,
      interventionsCompletedThisMonth,
      activeTechnicians,
      activeClients,
      interventionsToSchedule,
      alertsCount: interventionsToSchedule,
    });
  } catch (err) {
    next(err);
  }
}

export async function getInterventionsTrend(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { days = '30' } = req.query as Record<string, string>;
    const daysNum = Math.min(Number(days), 365);
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - daysNum);

    const interventions = await prisma.intervention.findMany({
      where: { scheduledAt: { gte: fromDate }, deletedAt: null },
      select: { scheduledAt: true, status: true },
    });

    // Raggruppa per giorno
    const byDay: Record<string, { completed: number; planned: number }> = {};
    interventions.forEach(i => {
      const day = i.scheduledAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { completed: 0, planned: 0 };
      if (['COMPLETED', 'CLOSED'].includes(i.status)) byDay[day].completed++;
      else byDay[day].planned++;
    });

    const trend = Object.entries(byDay).map(([date, counts]) => ({ date, ...counts })).sort((a, b) => a.date.localeCompare(b.date));
    ok(res, trend);
  } catch (err) {
    next(err);
  }
}

export async function getTechnicianPerformance(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN', isActive: true, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true,
        assignedInterventions: {
          where: { deletedAt: null, scheduledAt: { gte: monthStart } },
          select: { status: true, scheduledAt: true, startedAt: true, completedAt: true },
        },
      },
    });

    const performance = technicians.map(tech => {
      const total = tech.assignedInterventions.length;
      const completed = tech.assignedInterventions.filter(i => ['COMPLETED', 'CLOSED'].includes(i.status)).length;
      const durations = tech.assignedInterventions
        .filter(i => i.startedAt && i.completedAt)
        .map(i => (i.completedAt!.getTime() - i.startedAt!.getTime()) / 60000);
      const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      return {
        technician: { id: tech.id, firstName: tech.firstName, lastName: tech.lastName },
        totalInterventions: total,
        completedInterventions: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        averageDurationMinutes: avgDuration,
      };
    });

    ok(res, performance.sort((a, b) => b.totalInterventions - a.totalInterventions));
  } catch (err) {
    next(err);
  }
}

export async function getProblematicSites(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const points = await prisma.interventionPoint.findMany({
      where: { outcome: { in: ['ATTENTION', 'CRITICAL'] }, checkedAt: { gte: threeMonthsAgo } },
      include: {
        intervention: {
          include: {
            site: { select: { id: true, name: true, city: true } },
            client: { select: { id: true, businessName: true } },
          },
        },
      },
    });

    const bySite: Record<string, { site: unknown; client: unknown; criticalCount: number; attentionCount: number }> = {};
    points.forEach(p => {
      const siteId = p.intervention.site.id;
      if (!bySite[siteId]) {
        bySite[siteId] = { site: p.intervention.site, client: p.intervention.client, criticalCount: 0, attentionCount: 0 };
      }
      if (p.outcome === 'CRITICAL') bySite[siteId].criticalCount++;
      if (p.outcome === 'ATTENTION') bySite[siteId].attentionCount++;
    });

    const result = Object.values(bySite)
      .sort((a, b) => (b.criticalCount * 2 + b.attentionCount) - (a.criticalCount * 2 + a.attentionCount))
      .slice(0, 10);

    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getProductUsage(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const usage = await prisma.interventionProduct.groupBy({
      by: ['productId'],
      _count: { interventionId: true },
      _sum: { quantity: true },
      where: { intervention: { closedAt: { gte: threeMonthsAgo }, deletedAt: null } },
      orderBy: { _count: { interventionId: 'desc' } },
      take: 10,
    });

    const productIds = usage.map(u => u.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, category: true, unit: true } });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    const result = usage.map(u => ({
      product: productMap[u.productId],
      usageCount: u._count.interventionId,
      totalQuantity: u._sum.quantity,
    }));

    ok(res, result);
  } catch (err) {
    next(err);
  }
}
