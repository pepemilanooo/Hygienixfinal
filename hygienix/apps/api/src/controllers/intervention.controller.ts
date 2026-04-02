import { Request, Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { AppError } from '../middleware/errorHandler';
import { ok, created, paginate } from '../lib/response';
import { createAuditLog } from '../lib/audit';
import { uploadBuffer, uploadBase64Image } from '../lib/storage';
import { generateInterventionPdf } from '../lib/pdfGenerator';
import type { AuthRequest } from '../middleware/authenticate';

const INTERVENTION_SUMMARY_SELECT = {
  id: true, serviceType: true, status: true, priority: true,
  scheduledAt: true, scheduledEndAt: true, startedAt: true, completedAt: true, closedAt: true,
  reportPdfUrl: true,
  client: { select: { id: true, businessName: true } },
  site: { select: { id: true, name: true, city: true } },
  assignedTechnician: { select: { id: true, firstName: true, lastName: true } },
  createdAt: true,
};

function buildInterventionWhere(req: AuthRequest) {
  const base: Record<string, unknown> = { deletedAt: null };
  if (req.query.status) base.status = req.query.status;
  if (req.query.clientId) base.clientId = req.query.clientId;
  if (req.query.siteId) base.siteId = req.query.siteId;
  if (req.query.technicianId) base.assignedTechnicianId = req.query.technicianId;
  if (req.query.from || req.query.to) {
    base.scheduledAt = {
      ...(req.query.from && { gte: new Date(req.query.from as string) }),
      ...(req.query.to && { lte: new Date(req.query.to as string) }),
    };
  }
  return base;
}

async function assertInterventionAccess(req: AuthRequest, id: string) {
  const where: Record<string, unknown> = { id, deletedAt: null };
  if (req.user!.role === 'TECHNICIAN') where.assignedTechnicianId = req.user!.sub;
  const intervention = await prisma.intervention.findFirst({ where });
  if (!intervention) throw new AppError(404, 'NOT_FOUND', 'Intervento non trovato');
  return intervention;
}

export async function listInterventions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = buildInterventionWhere(req);

    const [total, interventions] = await Promise.all([
      prisma.intervention.count({ where }),
      prisma.intervention.findMany({
        where, select: INTERVENTION_SUMMARY_SELECT, skip, take: Number(limit),
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);
    paginate(res, interventions, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function getMyInterventions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 20, from, to } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {
      assignedTechnicianId: req.user!.sub,
      deletedAt: null,
      status: { notIn: ['ARCHIVED'] },
    };
    if (from || to) {
      where.scheduledAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [total, interventions] = await Promise.all([
      prisma.intervention.count({ where }),
      prisma.intervention.findMany({
        where, select: INTERVENTION_SUMMARY_SELECT, skip, take: Number(limit),
        orderBy: { scheduledAt: 'asc' },
      }),
    ]);
    paginate(res, interventions, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function createIntervention(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body;
    const client = await prisma.client.findFirst({ where: { id: data.clientId, deletedAt: null } });
    if (!client) throw new AppError(404, 'NOT_FOUND', 'Cliente non trovato');
    const site = await prisma.site.findFirst({ where: { id: data.siteId, clientId: data.clientId, deletedAt: null } });
    if (!site) throw new AppError(404, 'NOT_FOUND', 'Sede non trovata o non appartiene a questo cliente');

    const status = data.assignedTechnicianId ? 'ASSIGNED' : 'PLANNED';
    const intervention = await prisma.intervention.create({
      data: { ...data, status, createdById: req.user!.sub, scheduledAt: new Date(data.scheduledAt), scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : undefined },
      select: INTERVENTION_SUMMARY_SELECT,
    });

    await createAuditLog({ userId: req.user!.sub, action: 'INTERVENTION_CREATED', entityType: 'Intervention', entityId: intervention.id });
    created(res, intervention);
  } catch (err) {
    next(err);
  }
}

export async function getIntervention(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const where: Record<string, unknown> = { id: req.params.id, deletedAt: null };
    if (req.user!.role === 'TECHNICIAN') where.assignedTechnicianId = req.user!.sub;

    const intervention = await prisma.intervention.findFirst({
      where,
      include: {
        client: { select: { id: true, businessName: true, contactPhone: true, contactEmail: true } },
        site: { select: { id: true, name: true, address: true, city: true, localContactName: true, localContactPhone: true, operationalNotes: true } },
        assignedTechnician: { select: { id: true, firstName: true, lastName: true, phone: true } },
        photos: { orderBy: { createdAt: 'asc' } },
        products: { include: { product: { select: { id: true, name: true, activeIngredient: true, category: true } } } },
        points: { include: { siteCardPoint: true }, orderBy: { siteCardPoint: { code: 'asc' } } },
      },
    });
    if (!intervention) throw new AppError(404, 'NOT_FOUND', 'Intervento non trovato');
    ok(res, intervention);
  } catch (err) {
    next(err);
  }
}

export async function updateIntervention(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const data = { ...req.body };
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    if (data.scheduledEndAt) data.scheduledEndAt = new Date(data.scheduledEndAt);
    if (data.assignedTechnicianId && !data.status) data.status = 'ASSIGNED';

    const intervention = await prisma.intervention.update({
      where: { id: req.params.id },
      data,
      select: INTERVENTION_SUMMARY_SELECT,
    });
    ok(res, intervention);
  } catch (err) {
    next(err);
  }
}

export async function archiveIntervention(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    await prisma.intervention.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    res.json({ success: true, data: { message: 'Intervento archiviato' } });
  } catch (err) {
    next(err);
  }
}

export async function checkIn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const intervention = await assertInterventionAccess(req, req.params.id);
    if (intervention.status === 'IN_PROGRESS') throw new AppError(400, 'ALREADY_STARTED', 'Check-in già effettuato');
    if (!['ASSIGNED', 'PLANNED'].includes(intervention.status)) throw new AppError(400, 'INVALID_STATUS', `Impossibile fare check-in su intervento in stato ${intervention.status}`);

    const updated = await prisma.intervention.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      select: { id: true, status: true, startedAt: true },
    });
    await createAuditLog({ userId: req.user!.sub, action: 'INTERVENTION_CHECKIN', entityType: 'Intervention', entityId: req.params.id });
    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function checkOut(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const intervention = await assertInterventionAccess(req, req.params.id);
    if (intervention.status !== 'IN_PROGRESS') throw new AppError(400, 'INVALID_STATUS', 'Check-out disponibile solo per interventi in corso');

    const updated = await prisma.intervention.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      select: { id: true, status: true, completedAt: true },
    });
    await createAuditLog({ userId: req.user!.sub, action: 'INTERVENTION_CHECKOUT', entityType: 'Intervention', entityId: req.params.id });
    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function updateOutcome(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const { outcome, operationalNotes } = req.body;
    const updated = await prisma.intervention.update({
      where: { id: req.params.id },
      data: { outcome, operationalNotes },
      select: { id: true, outcome: true, operationalNotes: true },
    });
    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function uploadPhotos(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError(400, 'VALIDATION_ERROR', 'Nessuna foto caricata');

    const photoType = (req.body.type as string) || 'GENERIC';

    const photos = await Promise.all(
      files.map(async (file) => {
        const { url, key } = await uploadBuffer(file.buffer, `interventions/${req.params.id}/photos`, file.originalname, file.mimetype);
        return prisma.interventionPhoto.create({
          data: {
            interventionId: req.params.id,
            url: key,
            type: photoType as 'BEFORE' | 'AFTER' | 'GENERIC',
            caption: req.body.caption,
            uploadedById: req.user!.sub,
          },
        });
      })
    );
    ok(res, photos);
  } catch (err) {
    next(err);
  }
}

export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const photo = await prisma.interventionPhoto.findFirst({ where: { id: req.params.photoId, interventionId: req.params.id } });
    if (!photo) throw new AppError(404, 'NOT_FOUND', 'Foto non trovata');
    await prisma.interventionPhoto.delete({ where: { id: req.params.photoId } });
    res.json({ success: true, data: { message: 'Foto eliminata' } });
  } catch (err) {
    next(err);
  }
}

export async function saveTechnicianSignature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const { signatureData } = req.body;
    const { key } = await uploadBase64Image(signatureData, `interventions/${req.params.id}/signatures`);
    await prisma.intervention.update({ where: { id: req.params.id }, data: { technicianSignatureUrl: key } });
    await createAuditLog({ userId: req.user!.sub, action: 'INTERVENTION_TECHNICIAN_SIGNED', entityType: 'Intervention', entityId: req.params.id });
    ok(res, { message: 'Firma tecnico salvata', url: key });
  } catch (err) {
    next(err);
  }
}

export async function saveClientSignature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const { signatureData } = req.body;
    const { key } = await uploadBase64Image(signatureData, `interventions/${req.params.id}/signatures`);
    await prisma.intervention.update({ where: { id: req.params.id }, data: { clientSignatureUrl: key } });
    await createAuditLog({ userId: req.user!.sub, action: 'INTERVENTION_CLIENT_SIGNED', entityType: 'Intervention', entityId: req.params.id });
    ok(res, { message: 'Firma cliente salvata', url: key });
  } catch (err) {
    next(err);
  }
}

export async function addProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const { productId, quantity, unit, batchNumber, notes } = req.body;
    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Prodotto non trovato');
    const item = await prisma.interventionProduct.create({
      data: { interventionId: req.params.id, productId, quantity, unit, batchNumber, notes },
      include: { product: { select: { id: true, name: true, activeIngredient: true, category: true } } },
    });
    created(res, item);
  } catch (err) {
    next(err);
  }
}

export async function removeProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    await prisma.interventionProduct.delete({ where: { id: req.params.productId } });
    res.json({ success: true, data: { message: 'Prodotto rimosso' } });
  } catch (err) {
    next(err);
  }
}

export async function updateInterventionPoint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const { pointId } = req.params;
    const { outcome, notes, photoUrls } = req.body;

    const point = await prisma.interventionPoint.upsert({
      where: { interventionId_siteCardPointId: { interventionId: req.params.id, siteCardPointId: pointId } },
      create: {
        interventionId: req.params.id, siteCardPointId: pointId,
        outcome, notes, photoUrls: photoUrls || [],
        checkedAt: new Date(), checkedById: req.user!.sub,
      },
      update: { outcome, notes, ...(photoUrls && { photoUrls }), checkedAt: new Date(), checkedById: req.user!.sub },
      include: { siteCardPoint: true },
    });

    // Aggiorna stato del punto nel cartellino
    await prisma.siteCardPoint.update({
      where: { id: pointId },
      data: {
        status: outcome === 'OK' ? 'OK' : outcome === 'ATTENTION' ? 'ATTENTION' : outcome === 'CRITICAL' ? 'CRITICAL' : undefined,
        lastNotes: notes,
      },
    });

    ok(res, point);
  } catch (err) {
    next(err);
  }
}

export async function closeIntervention(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const intervention = await assertInterventionAccess(req, req.params.id);

    if (!['COMPLETED', 'IN_PROGRESS'].includes(intervention.status)) {
      throw new AppError(400, 'INVALID_STATUS', `Impossibile chiudere un intervento in stato ${intervention.status}`);
    }
    if (!intervention.technicianSignatureUrl) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Firma tecnico obbligatoria per chiudere l\'intervento');
    }

    // Transazione atomica di chiusura
    await prisma.$transaction(async (tx) => {
      // 1. Aggiorna stato intervento
      const now = new Date();
      await tx.intervention.update({
        where: { id: req.params.id },
        data: {
          status: 'CLOSED',
          closedAt: now,
          completedAt: intervention.completedAt || now,
        },
      });

      // 2. Aggiorna cartellino (versioning)
      const siteCard = await tx.siteCard.findFirst({ where: { siteId: intervention.siteId } });
      if (siteCard) {
        const snapshot = await tx.siteCardPoint.findMany({ where: { siteCardId: siteCard.id, deletedAt: null } });
        await tx.siteCardRevision.create({
          data: { siteCardId: siteCard.id, version: siteCard.version, snapshot: JSON.parse(JSON.stringify(snapshot)) },
        });
        await tx.siteCard.update({ where: { id: siteCard.id }, data: { version: { increment: 1 } } });
      }
    });

    // 3. Genera PDF (fuori dalla transazione per non bloccarla)
    try {
      const pdfKey = await generateInterventionPdf(req.params.id);
      await prisma.intervention.update({ where: { id: req.params.id }, data: { reportPdfUrl: pdfKey } });
    } catch (pdfErr) {
      // PDF generation failure non blocca la chiusura
      console.error('PDF generation failed:', pdfErr);
    }

    await createAuditLog({ userId: req.user!.sub, action: 'INTERVENTION_CLOSED', entityType: 'Intervention', entityId: req.params.id });
    ok(res, { message: 'Intervento chiuso con successo', interventionId: req.params.id });
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const intervention = await assertInterventionAccess(req, req.params.id);
    if (!intervention.reportPdfUrl) throw new AppError(404, 'NOT_FOUND', 'Report PDF non ancora generato');
    ok(res, { url: intervention.reportPdfUrl });
  } catch (err) {
    next(err);
  }
}

export async function regenerateReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertInterventionAccess(req, req.params.id);
    const pdfKey = await generateInterventionPdf(req.params.id);
    await prisma.intervention.update({ where: { id: req.params.id }, data: { reportPdfUrl: pdfKey } });
    ok(res, { message: 'Report rigenerato', url: pdfKey });
  } catch (err) {
    next(err);
  }
}
