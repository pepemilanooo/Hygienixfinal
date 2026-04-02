import { Response } from 'express';
import type { PaginationMeta } from '@hygienix/types';

export function ok<T>(res: Response, data: T, meta?: PaginationMeta): void {
  res.json({ success: true, data, ...(meta && { meta }) });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function paginate<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
  res.json({ success: true, data, meta });
}
