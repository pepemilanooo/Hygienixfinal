import { Response, NextFunction } from 'express';
import { prisma } from '@hygienix/database';
import { AppError } from '../middleware/errorHandler';
import { ok, created, paginate } from '../lib/response';
import type { AuthRequest } from '../middleware/authenticate';

export async function listProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 50, search, category } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      deletedAt: null,
      status: { not: 'ARCHIVED' as const },
      ...(category && { category }),
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { activeIngredient: { contains: search, mode: 'insensitive' as const } }] }),
    };
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
    ]);
    paginate(res, products, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await prisma.product.create({ data: req.body });
    created(res, product);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Prodotto non trovato');
    ok(res, product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Prodotto non trovato');
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    ok(res, product);
  } catch (err) {
    next(err);
  }
}

export async function archiveProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    res.json({ success: true, data: { message: 'Prodotto archiviato' } });
  } catch (err) {
    next(err);
  }
}
