import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { uploadBuffer } from '../lib/storage';
import { ok } from '../lib/response';
import type { AuthRequest } from '../middleware/authenticate';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();
router.use(authenticate);

// Upload generico — restituisce URL S3
router.post('/image', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Nessun file caricato' } }); return; }

    const folder = (req.body.folder as string) || 'uploads/misc';
    const { key, url } = await uploadBuffer(file.buffer, folder, file.originalname, file.mimetype);
    ok(res, { key, url, filename: file.originalname, size: file.size, mimeType: file.mimetype });
  } catch (err) {
    next(err);
  }
});

// Upload planimetria sede
router.post('/site-map/:siteId', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    const { prisma } = await import('@hygienix/database');
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Nessun file caricato' } }); return; }

    const { key } = await uploadBuffer(file.buffer, `sites/${req.params.siteId}/maps`, file.originalname, file.mimetype);
    const card = await prisma.siteCard.upsert({
      where: { siteId: req.params.siteId },
      update: { baseImageUrl: key },
      create: { siteId: req.params.siteId, baseImageUrl: key },
    });
    ok(res, { card, imageKey: key });
  } catch (err) {
    next(err);
  }
});

export default router;
